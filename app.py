import os
import logging
import re
import requests
import json
import subprocess
import yt_dlp
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, jsonify, send_file, abort, redirect, url_for, send_from_directory
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
    return render_template('new_index.html')

@app.route('/get_video_info', methods=['POST'])
def get_video_info():
    """Get video information from YouTube URL using yt-dlp"""
    url = request.form.get('url', '')
    
    if not url:
        return jsonify({'error': 'Please enter a YouTube URL'}), 400
    
    if not is_valid_youtube_url(url):
        return jsonify({'error': 'Invalid YouTube URL. Please enter a valid YouTube video URL.'}), 400
    
    try:
        video_id = get_video_id(url)
        if not video_id:
            return jsonify({'error': 'Could not extract video ID from URL'}), 400
        
        # Configure yt-dlp options
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extractaudio': False,
            'format': 'best',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video information
            info = ydl.extract_info(url, download=False)
            
            # Get thumbnail URLs
            thumbnails = {
                'default': f"https://img.youtube.com/vi/{video_id}/default.jpg",
                'high': f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                'medium': f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                'standard': f"https://img.youtube.com/vi/{video_id}/sddefault.jpg",
                'maxres': f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
            }
            
            # Extract available formats/streams
            video_streams = []
            audio_streams = []
            
            if 'formats' in info:
                for fmt in info['formats']:
                    # Video formats (with or without audio)
                    if fmt.get('vcodec') != 'none':
                        video_streams.append({
                            'format_id': fmt.get('format_id', ''),
                            'resolution': fmt.get('height', 'Unknown'),
                            'ext': fmt.get('ext', 'mp4'),
                            'filesize': fmt.get('filesize', 0),
                            'format_note': fmt.get('format_note', ''),
                            'fps': fmt.get('fps', 0),
                            'has_audio': fmt.get('acodec') != 'none'
                        })
                    
                    # Audio-only formats
                    if fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                        audio_streams.append({
                            'format_id': fmt.get('format_id', ''),
                            'ext': fmt.get('ext', 'mp3'),
                            'filesize': fmt.get('filesize', 0),
                            'format_note': fmt.get('format_note', ''),
                            'abr': fmt.get('abr', 0)
                        })
            
            # Sort streams by resolution/quality (highest first)
            video_streams = sorted(video_streams, key=lambda x: int(x['resolution']) if str(x['resolution']).isdigit() else 0, reverse=True)
            audio_streams = sorted(audio_streams, key=lambda x: x['abr'] if x['abr'] else 0, reverse=True)
            
            # Take best options
            video_streams = video_streams[:8]
            audio_streams = audio_streams[:5]
            
            # Format duration
            duration = info.get('duration', 0)
            duration_str = f"{duration // 60}:{duration % 60:02d}" if duration else "Unknown"
            
            # Create video info response
            video_info = {
                'title': info.get('title', f'YouTube Video ({video_id})'),
                'author': info.get('uploader', 'YouTube Creator'),
                'length': duration,
                'views': info.get('view_count', 0),
                'publish_date': info.get('upload_date', 'Unknown'),
                'thumbnails': thumbnails,
                'video_streams': video_streams,
                'audio_streams': audio_streams,
                'video_id': video_id,
                'duration_str': duration_str,
                'description': info.get('description', '')[:200] + '...' if info.get('description') else ''
            }
            
            return jsonify({'success': True, 'video_info': video_info})
    
    except Exception as e:
        logger.error(f"Error getting video info: {str(e)}")
        return jsonify({'error': f'Unable to fetch video information. Please check the URL and try again.'}), 500

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
    """Download YouTube video using yt-dlp"""
    try:
        url = request.args.get('url')
        format_id = request.args.get('format_id', 'best[height<=720]')
        
        if not url:
            return jsonify({'error': 'Missing video URL'}), 400
        
        video_id = get_video_id(url)
        if not video_id:
            return jsonify({'error': 'Invalid video URL'}), 400
        
        # Create temporary directory for download
        temp_dir = tempfile.mkdtemp()
        
        # Configure yt-dlp options for download
        ydl_opts = {
            'format': format_id,
            'outtmpl': os.path.join(temp_dir, f'{video_id}.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'merge_output_format': 'mp4',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Download the video
            info = ydl.extract_info(url, download=True)
            
            # Find the downloaded file
            downloaded_file = None
            for file in os.listdir(temp_dir):
                if file.startswith(video_id):
                    downloaded_file = os.path.join(temp_dir, file)
                    break
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                return jsonify({'error': 'Failed to download video'}), 500
            
            # Clean up title for filename
            title = info.get('title', 'youtube_video')
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()[:50]
            
            # Get file extension
            _, ext = os.path.splitext(downloaded_file)
            filename = f"{safe_title}{ext}"
            
            def remove_file():
                try:
                    if os.path.exists(downloaded_file):
                        os.remove(downloaded_file)
                    os.rmdir(temp_dir)
                except:
                    pass
            
            return send_file(
                downloaded_file,
                as_attachment=True,
                download_name=filename,
                mimetype='video/mp4'
            )
    
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return jsonify({'error': f'Failed to download video: {str(e)}'}), 500

@app.route('/download_audio', methods=['GET'])
def download_audio():
    """Download YouTube audio as MP3 using yt-dlp"""
    try:
        url = request.args.get('url')
        format_id = request.args.get('format_id', 'bestaudio')
        
        if not url:
            return jsonify({'error': 'Missing video URL'}), 400
        
        video_id = get_video_id(url)
        if not video_id:
            return jsonify({'error': 'Invalid video URL'}), 400
        
        # Create temporary directory for download
        temp_dir = tempfile.mkdtemp()
        
        # Configure yt-dlp options for audio extraction
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(temp_dir, f'{video_id}.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Download and extract audio
            info = ydl.extract_info(url, download=True)
            
            # Find the downloaded MP3 file
            downloaded_file = None
            for file in os.listdir(temp_dir):
                if file.endswith('.mp3'):
                    downloaded_file = os.path.join(temp_dir, file)
                    break
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                return jsonify({'error': 'Failed to extract audio'}), 500
            
            # Clean up title for filename
            title = info.get('title', 'youtube_audio')
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()[:50]
            filename = f"{safe_title}.mp3"
            
            return send_file(
                downloaded_file,
                as_attachment=True,
                download_name=filename,
                mimetype='audio/mpeg'
            )
    
    except Exception as e:
        logger.error(f"Error downloading audio: {str(e)}")
        return jsonify({'error': f'Failed to download audio: {str(e)}'}), 500

@app.route('/sw.js')
def service_worker():
    """Serve the service worker file"""
    return send_from_directory('static', 'sw.js', mimetype='application/javascript')

@app.route('/manifest.json')
def manifest():
    """Serve the PWA manifest"""
    manifest_data = {
        "name": "E-LEAKxDOWN - YouTube Downloader",
        "short_name": "E-LEAKxDOWN",
        "description": "Ultimate YouTube Video & Audio Downloader with unlimited downloads",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0a0a0a",
        "theme_color": "#00ff88",
        "orientation": "portrait-primary",
        "icons": [
            {
                "src": "https://i.postimg.cc/ZKGmmSyr/a5f7295b-f621-4163-b66d-8edadf7721d8-removebg-preview-1-1.webp",
                "sizes": "192x192",
                "type": "image/webp",
                "purpose": "any maskable"
            }
        ],
        "categories": ["utilities", "multimedia"],
        "lang": "en",
        "scope": "/"
    }
    return jsonify(manifest_data)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error="Internal server error"), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
