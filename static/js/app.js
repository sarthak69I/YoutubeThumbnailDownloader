document.addEventListener('DOMContentLoaded', function() {
    // DOM elements with null checks
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
    const videoDescription = document.getElementById('videoDescription');
    const thumbnailQuality = document.getElementById('thumbnailQuality');
    const downloadThumbnailBtn = document.getElementById('downloadThumbnailBtn');
    const videoQuality = document.getElementById('videoQuality');
    const downloadVideoBtn = document.getElementById('downloadVideoBtn');
    const audioQuality = document.getElementById('audioQuality');
    const downloadAudioBtn = document.getElementById('downloadAudioBtn');

    // Check if essential elements exist
    if (!urlForm || !youtubeUrl || !submitBtn) {
        console.error('Essential DOM elements not found');
        return;
    }

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

    // Add fade-in animation to elements
    function addFadeInAnimation(element) {
        element.classList.add('fade-in');
    }

    // Handle form submission
    urlForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const url = youtubeUrl.value.trim();
        if (!url) {
            showError('Please enter a YouTube URL');
            return;
        }

        currentVideoId = extractVideoId(url);
        
        // Reset UI
        hideError();
        hideVideoInfo();
        showLoading();
        
        // Disable button during request
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
            hideLoading();
            submitBtn.disabled = false;
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Store video data
            currentVideoData = data.video_info;
            
            // Update UI with video information
            displayVideoInfo(currentVideoData);
            showVideoInfo();
        })
        .catch(error => {
            hideLoading();
            submitBtn.disabled = false;
            showError("An error occurred while fetching video information. Please try again.");
            console.error('Error:', error);
        });
    });

    // Display video information
    function displayVideoInfo(videoData) {
        // Update video details
        if (videoThumbnail) videoThumbnail.src = videoData.thumbnails.high;
        if (videoTitle) videoTitle.textContent = videoData.title;
        if (videoAuthor) videoAuthor.textContent = videoData.author;
        if (videoDuration) videoDuration.textContent = videoData.duration_str || 'Unknown';
        if (videoViews) videoViews.textContent = videoData.views ? formatNumber(videoData.views) : 'Unknown';
        if (videoPublished) videoPublished.textContent = videoData.publish_date || 'Unknown';
        if (videoDescription) videoDescription.textContent = videoData.description || 'No description available';

        // Populate video quality dropdown
        if (videoQuality && videoData.video_streams) {
            videoQuality.innerHTML = '';
            if (videoData.video_streams.length > 0) {
                videoData.video_streams.forEach(stream => {
                    const option = document.createElement('option');
                    option.value = stream.format_id;
                    const resolution = stream.resolution !== 'Unknown' ? stream.resolution + 'p' : 'Unknown';
                    const filesize = stream.filesize ? Math.round(stream.filesize / (1024 * 1024)) + ' MB' : 'Unknown size';
                    const fps = stream.fps ? ` ${stream.fps}fps` : '';
                    option.textContent = `${resolution}${fps} (${stream.ext}) - ${filesize}`;
                    videoQuality.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = 'best';
                option.textContent = 'Best Quality Available';
                videoQuality.appendChild(option);
            }
        }
    }

    // Show/Hide functions
    function showLoading() {
        if (loadingIndicator) {
            loadingIndicator.classList.remove('d-none');
            addFadeInAnimation(loadingIndicator);
        }
    }

    function hideLoading() {
        if (loadingIndicator) loadingIndicator.classList.add('d-none');
    }

    function showError(message) {
        if (errorContainer) {
            const errorMessage = errorContainer.querySelector('.error-message');
            if (errorMessage) errorMessage.textContent = message;
            errorContainer.classList.remove('d-none');
            addFadeInAnimation(errorContainer);
        }
    }

    function hideError() {
        if (errorContainer) errorContainer.classList.add('d-none');
    }

    function showVideoInfo() {
        if (videoInfoContainer) {
            videoInfoContainer.classList.remove('d-none');
            addFadeInAnimation(videoInfoContainer);
        }
    }

    function hideVideoInfo() {
        if (videoInfoContainer) videoInfoContainer.classList.add('d-none');
    }

    // Handle thumbnail download
    if (downloadThumbnailBtn) {
        downloadThumbnailBtn.addEventListener('click', function() {
            if (!currentVideoData || !currentVideoId) {
                showError("No video data available. Please fetch a video first.");
                return;
            }
            
            const quality = thumbnailQuality ? thumbnailQuality.value : 'high';
            const thumbnailUrl = currentVideoData.thumbnails[quality];
            
            // Create download link
            window.location.href = `/download_thumbnail?url=${encodeURIComponent(thumbnailUrl)}&video_id=${currentVideoId}&quality=${quality}`;
        });
    }

    // Handle video download
    if (downloadVideoBtn) {
        downloadVideoBtn.addEventListener('click', function() {
            if (!currentVideoData || !currentVideoId) {
                showError("No video data available. Please fetch a video first.");
                return;
            }
            
            const selectedFormatId = videoQuality ? videoQuality.value : 'best';
            if (!selectedFormatId) {
                showError("Please select a video quality.");
                return;
            }
            
            // Disable button and show message
            downloadVideoBtn.disabled = true;
            const originalText = downloadVideoBtn.innerHTML;
            downloadVideoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Download...';
            
            // Start download using original URL and format_id
            const originalUrl = youtubeUrl.value;
            window.location.href = `/download_video?url=${encodeURIComponent(originalUrl)}&format_id=${selectedFormatId}`;
            
            // Re-enable button after 5 seconds
            setTimeout(() => {
                downloadVideoBtn.disabled = false;
                downloadVideoBtn.innerHTML = originalText;
            }, 5000);
        });
    }

    // Handle audio download
    if (downloadAudioBtn) {
        downloadAudioBtn.addEventListener('click', function() {
            if (!currentVideoData || !currentVideoId) {
                showError("No video data available. Please fetch a video first.");
                return;
            }
            
            const selectedQuality = audioQuality ? audioQuality.value : 'bestaudio';
            
            // Disable button and show message
            downloadAudioBtn.disabled = true;
            const originalText = downloadAudioBtn.innerHTML;
            downloadAudioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extracting Audio...';
            
            // Start audio download
            const originalUrl = youtubeUrl.value;
            window.location.href = `/download_audio?url=${encodeURIComponent(originalUrl)}&format_id=${selectedQuality}`;
            
            // Re-enable button after 8 seconds (audio processing takes longer)
            setTimeout(() => {
                downloadAudioBtn.disabled = false;
                downloadAudioBtn.innerHTML = originalText;
            }, 8000);
        });
    }

    // Preview thumbnail when quality changes
    if (thumbnailQuality) {
        thumbnailQuality.addEventListener('change', function() {
            if (currentVideoData && videoThumbnail) {
                const quality = thumbnailQuality.value;
                videoThumbnail.src = currentVideoData.thumbnails[quality];
            }
        });
    }

    // Add smooth scrolling to results
    function scrollToResults() {
        if (videoInfoContainer && !videoInfoContainer.classList.contains('d-none')) {
            videoInfoContainer.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // Auto-scroll to results when they appear
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' && 
                mutation.target === videoInfoContainer &&
                !videoInfoContainer.classList.contains('d-none')) {
                setTimeout(scrollToResults, 300);
            }
        });
    });

    if (videoInfoContainer) {
        observer.observe(videoInfoContainer, { attributes: true });
    }

    // Add input animation
    if (youtubeUrl) {
        youtubeUrl.addEventListener('focus', function() {
            const container = youtubeUrl.closest('.input-container');
            if (container) container.style.transform = 'translateY(-2px)';
        });

        youtubeUrl.addEventListener('blur', function() {
            const container = youtubeUrl.closest('.input-container');
            if (container) container.style.transform = 'translateY(0)';
        });
    }
});