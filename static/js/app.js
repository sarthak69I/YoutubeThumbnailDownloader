document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const urlForm = document.getElementById('urlForm');
    const youtubeUrl = document.getElementById('youtubeUrl');
    const submitBtn = document.getElementById('submitBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorContainer = document.getElementById('errorContainer');
    const videoInfoContainer = document.getElementById('videoInfoContainer');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const videoAuthor = document.getElementById('videoAuthor');
    const videoDuration = document.getElementById('videoDuration');
    const videoViews = document.getElementById('videoViews');
    const videoPublished = document.getElementById('videoPublished');
    const thumbnailQuality = document.getElementById('thumbnailQuality');
    const downloadThumbnailBtn = document.getElementById('downloadThumbnailBtn');
    const videoQuality = document.getElementById('videoQuality');
    const downloadVideoBtn = document.getElementById('downloadVideoBtn');

    // Store video data
    let currentVideoData = null;
    let currentVideoId = null;

    // Format duration from seconds to HH:MM:SS
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Extract video ID from URL
    function extractVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    // Handle form submission
    urlForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset UI
        errorContainer.classList.add('d-none');
        videoInfoContainer.classList.add('d-none');
        
        const url = youtubeUrl.value.trim();
        if (!url) {
            showError("Please enter a YouTube URL");
            return;
        }
        
        // Extract video ID
        currentVideoId = extractVideoId(url);
        
        // Show loading indicator
        loadingIndicator.classList.remove('d-none');
        submitBtn.disabled = true;
        
        // Create form data
        const formData = new FormData();
        formData.append('url', url);
        
        // Fetch video information
        fetch('/get_video_info', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            loadingIndicator.classList.add('d-none');
            submitBtn.disabled = false;
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Store video data
            currentVideoData = data.video_info;
            
            // Update UI with video information
            videoThumbnail.src = currentVideoData.thumbnails.high;
            videoTitle.textContent = currentVideoData.title;
            videoAuthor.textContent = currentVideoData.author;
            videoDuration.textContent = formatDuration(currentVideoData.length);
            videoViews.textContent = formatNumber(currentVideoData.views);
            videoPublished.textContent = currentVideoData.publish_date;
            
            // Populate video quality dropdown
            videoQuality.innerHTML = '';
            currentVideoData.streams.forEach(stream => {
                const option = document.createElement('option');
                option.value = stream.itag;
                option.textContent = `${stream.resolution} (${stream.mime_type}) - ~${stream.size_mb} MB`;
                videoQuality.appendChild(option);
            });
            
            // Show video information
            videoInfoContainer.classList.remove('d-none');
        })
        .catch(error => {
            loadingIndicator.classList.add('d-none');
            submitBtn.disabled = false;
            showError("An error occurred while fetching video information. Please try again.");
            console.error('Error:', error);
        });
    });

    // Show error message
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('d-none');
    }

    // Handle thumbnail download
    downloadThumbnailBtn.addEventListener('click', function() {
        if (!currentVideoData || !currentVideoId) {
            showError("No video data available. Please fetch a video first.");
            return;
        }
        
        const quality = thumbnailQuality.value;
        const thumbnailUrl = currentVideoData.thumbnails[quality];
        
        // Create download link
        window.location.href = `/download_thumbnail?url=${encodeURIComponent(thumbnailUrl)}&video_id=${currentVideoId}&quality=${quality}`;
    });

    // Handle video download
    downloadVideoBtn.addEventListener('click', function() {
        if (!currentVideoData) {
            showError("No video data available. Please fetch a video first.");
            return;
        }
        
        const selectedItag = videoQuality.value;
        if (!selectedItag) {
            showError("Please select a video quality.");
            return;
        }
        
        // Disable button and show message
        downloadVideoBtn.disabled = true;
        downloadVideoBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Preparing Download...';
        
        // Start download
        window.location.href = `/download_video?url=${encodeURIComponent(youtubeUrl.value)}&itag=${selectedItag}`;
        
        // Re-enable button after 3 seconds
        setTimeout(() => {
            downloadVideoBtn.disabled = false;
            downloadVideoBtn.innerHTML = '<i class="fas fa-download me-1"></i> Download Video';
        }, 3000);
    });

    // Preview thumbnail when quality changes
    thumbnailQuality.addEventListener('change', function() {
        if (currentVideoData) {
            const quality = thumbnailQuality.value;
            videoThumbnail.src = currentVideoData.thumbnails[quality];
        }
    });
});
