import os
import logging
import re
import requests
import json
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, jsonify, send_file, abort, redirect, url_for
import io
import tempfile

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "youtube-downloader-secret")

def is_valid_youtube_url(url):
    """Validate if the provided URL is a valid YouTube URL"""
    youtube_regex = r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    youtube_regex_match = re.match(youtube_regex, url)
    
    if not youtube_regex_match:
        return False
    
    return True

def get_video_id(url):
    """Extract video ID from YouTube URL"""
    if 'youtu.be' in url:
        return url.split('/')[-1].split('?')[0]
    
    parsed_url = urlparse(url)
    
    if parsed_url.hostname in ('youtu.be', 'www.youtu.be'):
        return parsed_url.path[1:]
    
    if parsed_url.hostname in ('youtube.com', 'www.youtube.com'):
        if parsed_url.path == '/watch':
            query = parse_qs(parsed_url.query)
            return query.get('v', [None])[0]
        
        if parsed_url.path.startswith('/embed/'):
            return parsed_url.path.split('/')[2]
        
        if parsed_url.path.startswith('/v/'):
            return parsed_url.path.split('/')[2]
    
    return None

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/get_video_info', methods=['POST'])
def get_video_info():
    """Get video information from YouTube URL using a more reliable direct approach"""
    url = request.form.get('url', '')
    
    if not url:
        return jsonify({'error': 'Please enter a YouTube URL'}), 400
    
    if not is_valid_youtube_url(url):
        return jsonify({'error': 'Invalid YouTube URL. Please enter a valid YouTube video URL.'}), 400
    
    try:
        video_id = get_video_id(url)
        if not video_id:
            return jsonify({'error': 'Could not extract video ID from URL'}), 400
        
        # Get thumbnail URLs (these are reliable and don't need an API)
        thumbnails = {
            'default': f"https://img.youtube.com/vi/{video_id}/default.jpg",
            'high': f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            'medium': f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
            'standard': f"https://img.youtube.com/vi/{video_id}/sddefault.jpg",
            'maxres': f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        }
        
        # Check if thumbnails exist by making a request to the high quality one
        response = requests.get(thumbnails['high'])
        if response.status_code != 200:
            return jsonify({'error': 'Video not found or not accessible'}), 404
        
        # For demo purposes, provide some sample stream options
        # In a real implementation, we would need to use pytube or another method to get real stream info
        streams = [
            {
                'itag': '18',
                'resolution': '360p',
                'mime_type': 'video/mp4',
                'size_mb': 'Unknown'
            },
            {
                'itag': '22',
                'resolution': '720p',
                'mime_type': 'video/mp4',
                'size_mb': 'Unknown'
            }
        ]
        
        # Create a simplified video info response
        video_info = {
            'title': f"YouTube Video ({video_id})",
            'author': 'YouTube Creator',
            'length': 0,
            'views': 0,
            'publish_date': 'Unknown',
            'thumbnails': thumbnails,
            'streams': streams,
            'video_id': video_id
        }
        
        return jsonify({'success': True, 'video_info': video_info})
    
    except Exception as e:
        logger.error(f"Error getting video info: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}. Please try a different video URL.'}), 500

@app.route('/download_thumbnail', methods=['GET'])
def download_thumbnail():
    """Download YouTube video thumbnail"""
    try:
        thumbnail_url = request.args.get('url')
        video_id = request.args.get('video_id')
        quality = request.args.get('quality', 'high')
        
        if not thumbnail_url or not video_id:
            return jsonify({'error': 'Missing thumbnail URL or video ID'}), 400
        
        # Define quality mappings
        quality_mapping = {
            'default': 'default',
            'high': 'hqdefault',
            'medium': 'mqdefault',
            'standard': 'sddefault',
            'maxres': 'maxresdefault'
        }
        
        # Construct actual thumbnail URL
        actual_quality = quality_mapping.get(quality, 'hqdefault')
        actual_url = f"https://img.youtube.com/vi/{video_id}/{actual_quality}.jpg"
        
        # Import here to avoid circular imports
        import requests
        
        response = requests.get(actual_url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to download thumbnail'}), 500
        
        # Create an in-memory file
        file_object = io.BytesIO(response.content)
        file_object.seek(0)
        
        filename = f"{video_id}_{actual_quality}.jpg"
        
        return send_file(
            file_object,
            as_attachment=True,
            download_name=filename,
            mimetype='image/jpeg'
        )
    
    except Exception as e:
        logger.error(f"Error downloading thumbnail: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/download_video', methods=['GET'])
def download_video():
    """Download YouTube video"""
    try:
        video_id = request.args.get('video_id')
        
        if not video_id:
            return jsonify({'error': 'Missing video ID'}), 400
        
        # For this simplified version, we'll redirect to a YT download service
        # In a real implementation, you would need a more reliable video downloading method
        return render_template('video_download.html', video_id=video_id)
    
    except Exception as e:
        logger.error(f"Error with video download: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error="Internal server error"), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
