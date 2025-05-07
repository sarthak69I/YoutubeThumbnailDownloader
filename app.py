import os
import logging
import re
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, jsonify, send_file, abort, redirect, url_for
from pytube import YouTube
from pytube.exceptions import RegexMatchError, VideoUnavailable
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
    """Get video information from YouTube URL"""
    url = request.form.get('url', '')
    
    if not url:
        return jsonify({'error': 'Please enter a YouTube URL'}), 400
    
    if not is_valid_youtube_url(url):
        return jsonify({'error': 'Invalid YouTube URL. Please enter a valid YouTube video URL.'}), 400
    
    try:
        yt = YouTube(url)
        
        # Get thumbnail URLs
        thumbnails = {
            'default': yt.thumbnail_url,
            'high': f"https://img.youtube.com/vi/{get_video_id(url)}/hqdefault.jpg",
            'medium': f"https://img.youtube.com/vi/{get_video_id(url)}/mqdefault.jpg",
            'standard': f"https://img.youtube.com/vi/{get_video_id(url)}/sddefault.jpg",
            'maxres': f"https://img.youtube.com/vi/{get_video_id(url)}/maxresdefault.jpg"
        }
        
        # Get video streams info
        streams = []
        for stream in yt.streams.filter(progressive=True).order_by('resolution').desc():
            streams.append({
                'itag': stream.itag,
                'resolution': stream.resolution,
                'mime_type': stream.mime_type,
                'size_mb': round(stream.filesize / (1024 * 1024), 2)
            })
        
        # Get video details
        video_info = {
            'title': yt.title,
            'author': yt.author,
            'length': yt.length,
            'views': yt.views,
            'publish_date': str(yt.publish_date) if yt.publish_date else 'Unknown',
            'thumbnails': thumbnails,
            'streams': streams
        }
        
        return jsonify({'success': True, 'video_info': video_info})
    
    except RegexMatchError:
        return jsonify({'error': 'Invalid YouTube URL. Please enter a valid YouTube video URL.'}), 400
    except VideoUnavailable:
        return jsonify({'error': 'This video is unavailable. It might be private or removed.'}), 400
    except Exception as e:
        logger.error(f"Error getting video info: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

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
        url = request.args.get('url')
        itag = request.args.get('itag')
        
        if not url or not itag:
            return jsonify({'error': 'Missing URL or itag'}), 400
        
        yt = YouTube(url)
        stream = yt.streams.get_by_itag(int(itag))
        
        if not stream:
            return jsonify({'error': 'Selected video quality not available'}), 400
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            temp_path = temp_file.name
        
        # Download the file
        stream.download(output_path=os.path.dirname(temp_path), filename=os.path.basename(temp_path))
        
        # Get a safe filename
        safe_filename = "".join([c for c in yt.title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        if not safe_filename:
            safe_filename = "youtube_video"
        safe_filename = f"{safe_filename}_{stream.resolution}.mp4"
        
        return send_file(
            temp_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='video/mp4'
        )
    
    except RegexMatchError:
        return jsonify({'error': 'Invalid YouTube URL'}), 400
    except VideoUnavailable:
        return jsonify({'error': 'This video is unavailable'}), 400
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500
    finally:
        # Clean up the temporary file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass

@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error="Internal server error"), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
