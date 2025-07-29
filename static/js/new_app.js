// E-LEAKxDOWN - New App JavaScript with Enhanced UX

class YouTubeDownloader {
    constructor() {
        this.currentVideoData = null;
        this.currentVideoId = null;
        this.initializeElements();
        this.bindEvents();
        this.initializeAnimations();
    }

    initializeElements() {
        // Form elements
        this.urlForm = document.getElementById('urlForm');
        this.youtubeUrl = document.getElementById('youtubeUrl');
        this.submitBtn = document.getElementById('submitBtn');
        
        // UI containers
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorContainer = document.getElementById('errorContainer');
        this.videoInfoContainer = document.getElementById('videoInfoContainer');
        
        // Video info elements
        this.videoThumbnail = document.getElementById('videoThumbnail');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoAuthor = document.getElementById('videoAuthor');
        this.videoDuration = document.getElementById('videoDuration');
        this.videoViews = document.getElementById('videoViews');
        this.videoPublished = document.getElementById('videoPublished');
        this.videoDescription = document.getElementById('videoDescription');
        
        // Download elements
        this.thumbnailQuality = document.getElementById('thumbnailQuality');
        this.downloadThumbnailBtn = document.getElementById('downloadThumbnailBtn');
        this.videoQuality = document.getElementById('videoQuality');
        this.downloadVideoBtn = document.getElementById('downloadVideoBtn');
        this.audioQuality = document.getElementById('audioQuality');
        this.downloadAudioBtn = document.getElementById('downloadAudioBtn');
        this.errorMessage = document.getElementById('errorMessage');
    }

    bindEvents() {
        // Form submission
        if (this.urlForm) {
            this.urlForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Download buttons
        if (this.downloadThumbnailBtn) {
            this.downloadThumbnailBtn.addEventListener('click', () => this.downloadThumbnail());
        }

        if (this.downloadVideoBtn) {
            this.downloadVideoBtn.addEventListener('click', () => this.downloadVideo());
        }

        if (this.downloadAudioBtn) {
            this.downloadAudioBtn.addEventListener('click', () => this.downloadAudio());
        }

        // Thumbnail quality preview
        if (this.thumbnailQuality) {
            this.thumbnailQuality.addEventListener('change', () => this.updateThumbnailPreview());
        }

        // Input animations
        if (this.youtubeUrl) {
            this.youtubeUrl.addEventListener('focus', () => this.animateInputFocus(true));
            this.youtubeUrl.addEventListener('blur', () => this.animateInputFocus(false));
            this.youtubeUrl.addEventListener('paste', () => {
                setTimeout(() => this.validateUrl(), 100);
            });
        }
    }

    initializeAnimations() {
        // Intersection Observer for scroll animations
        this.observeElements();
        
        // Add entrance animations to feature cards
        setTimeout(() => this.animateFeatureCards(), 500);
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        // Observe feature cards and download cards
        document.querySelectorAll('.feature-card, .download-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
    }

    animateFeatureCards() {
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    animateInputFocus(focused) {
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            if (focused) {
                searchSection.style.transform = 'translateY(-5px) scale(1.02)';
                searchSection.style.boxShadow = '0 25px 60px rgba(139, 92, 246, 0.3)';
            } else {
                searchSection.style.transform = 'translateY(-5px) scale(1)';
                searchSection.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.6)';
            }
        }
    }

    validateUrl() {
        const url = this.youtubeUrl.value.trim();
        const isValid = this.isValidYouTubeUrl(url);
        
        if (url && !isValid) {
            this.youtubeUrl.style.borderColor = '#ef4444';
            this.youtubeUrl.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2)';
        } else {
            this.youtubeUrl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            this.youtubeUrl.style.boxShadow = 'none';
        }
    }

    isValidYouTubeUrl(url) {
        const regex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%\?]{11})/;
        return regex.test(url);
    }

    extractVideoId(url) {
        const regex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regex);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const url = this.youtubeUrl.value.trim();
        if (!url) {
            this.showError('Please enter a YouTube URL');
            return;
        }

        if (!this.isValidYouTubeUrl(url)) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }

        this.currentVideoId = this.extractVideoId(url);
        
        // Reset UI
        this.hideError();
        this.hideVideoInfo();
        this.showLoading();
        
        // Disable form
        this.setFormState(false);
        
        try {
            const formData = new FormData();
            formData.append('url', url);
            
            const response = await fetch('/get_video_info', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            this.hideLoading();
            this.setFormState(true);
            
            if (data.error) {
                this.showError(data.error);
                return;
            }
            
            this.currentVideoData = data.video_info;
            this.displayVideoInfo(this.currentVideoData);
            this.showVideoInfo();
            
        } catch (error) {
            this.hideLoading();
            this.setFormState(true);
            this.showError('Failed to fetch video information. Please try again.');
            console.error('Error:', error);
        }
    }

    displayVideoInfo(videoData) {
        // Update video details
        if (this.videoThumbnail) this.videoThumbnail.src = videoData.thumbnails.high;
        if (this.videoTitle) this.videoTitle.textContent = videoData.title;
        if (this.videoAuthor) this.videoAuthor.textContent = videoData.author;
        if (this.videoDuration) this.videoDuration.textContent = videoData.duration_str || 'Unknown';
        if (this.videoViews) this.videoViews.textContent = this.formatNumber(videoData.views) || 'Unknown';
        if (this.videoPublished) this.videoPublished.textContent = this.formatDate(videoData.publish_date) || 'Unknown';
        if (this.videoDescription) this.videoDescription.textContent = videoData.description || 'No description available';

        // Populate video quality options
        this.populateVideoQualities(videoData.video_streams);
    }

    populateVideoQualities(streams) {
        if (!this.videoQuality || !streams) return;
        
        this.videoQuality.innerHTML = '';
        
        if (streams.length > 0) {
            streams.forEach(stream => {
                const option = document.createElement('option');
                option.value = stream.format_id;
                
                const resolution = stream.resolution !== 'Unknown' ? `${stream.resolution}p` : 'Unknown';
                const filesize = stream.filesize ? `${Math.round(stream.filesize / (1024 * 1024))} MB` : 'Unknown size';
                const fps = stream.fps ? ` ${stream.fps}fps` : '';
                const format = stream.ext ? ` (${stream.ext.toUpperCase()})` : '';
                
                option.textContent = `${resolution}${fps}${format} - ${filesize}`;
                this.videoQuality.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = 'best';
            option.textContent = 'Best Quality Available';
            this.videoQuality.appendChild(option);
        }
    }

    async downloadThumbnail() {
        if (!this.currentVideoData || !this.currentVideoId) {
            this.showError('No video data available. Please analyze a video first.');
            return;
        }
        
        const quality = this.thumbnailQuality.value;
        const thumbnailUrl = this.currentVideoData.thumbnails[quality];
        
        this.animateDownloadButton(this.downloadThumbnailBtn, 'Downloading...');
        
        const downloadUrl = `/download_thumbnail?url=${encodeURIComponent(thumbnailUrl)}&video_id=${this.currentVideoId}&quality=${quality}`;
        window.location.href = downloadUrl;
        
        setTimeout(() => {
            this.resetDownloadButton(this.downloadThumbnailBtn, '<i class="fas fa-download"></i> Download Thumbnail');
        }, 3000);
    }

    async downloadVideo() {
        if (!this.currentVideoData || !this.currentVideoId) {
            this.showError('No video data available. Please analyze a video first.');
            return;
        }
        
        const formatId = this.videoQuality.value;
        if (!formatId) {
            this.showError('Please select a video quality.');
            return;
        }
        
        this.animateDownloadButton(this.downloadVideoBtn, 'Preparing...');
        
        const originalUrl = this.youtubeUrl.value;
        const downloadUrl = `/download_video?url=${encodeURIComponent(originalUrl)}&format_id=${formatId}`;
        window.location.href = downloadUrl;
        
        setTimeout(() => {
            this.resetDownloadButton(this.downloadVideoBtn, '<i class="fas fa-download"></i> Download Video');
        }, 5000);
    }

    async downloadAudio() {
        if (!this.currentVideoData || !this.currentVideoId) {
            this.showError('No video data available. Please analyze a video first.');
            return;
        }
        
        const quality = this.audioQuality.value;
        
        this.animateDownloadButton(this.downloadAudioBtn, 'Extracting...');
        
        const originalUrl = this.youtubeUrl.value;
        const downloadUrl = `/download_audio?url=${encodeURIComponent(originalUrl)}&format_id=${quality}`;
        window.location.href = downloadUrl;
        
        setTimeout(() => {
            this.resetDownloadButton(this.downloadAudioBtn, '<i class="fas fa-headphones"></i> Extract MP3');
        }, 8000);
    }

    updateThumbnailPreview() {
        if (this.currentVideoData && this.videoThumbnail) {
            const quality = this.thumbnailQuality.value;
            this.videoThumbnail.src = this.currentVideoData.thumbnails[quality];
        }
    }

    animateDownloadButton(button, text) {
        if (!button) return;
        
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
    }

    resetDownloadButton(button, originalText) {
        if (!button) return;
        
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = originalText;
    }

    setFormState(enabled) {
        if (this.submitBtn) this.submitBtn.disabled = !enabled;
        if (this.youtubeUrl) this.youtubeUrl.disabled = !enabled;
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
            this.loadingIndicator.style.animation = 'fadeInUp 0.6s ease';
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    showError(message) {
        if (this.errorContainer && this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorContainer.style.display = 'block';
            this.errorContainer.style.animation = 'fadeInUp 0.6s ease';
            
            // Auto-hide after 5 seconds
            setTimeout(() => this.hideError(), 5000);
        }
    }

    hideError() {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
    }

    showVideoInfo() {
        if (this.videoInfoContainer) {
            this.videoInfoContainer.style.display = 'block';
            this.videoInfoContainer.style.animation = 'slideInUp 0.8s ease';
            
            // Scroll to video info
            setTimeout(() => {
                this.videoInfoContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
            
            // Animate download cards
            setTimeout(() => this.animateDownloadCards(), 300);
        }
    }

    hideVideoInfo() {
        if (this.videoInfoContainer) {
            this.videoInfoContainer.style.display = 'none';
        }
    }

    animateDownloadCards() {
        const cards = document.querySelectorAll('.download-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    formatNumber(num) {
        if (!num) return 'Unknown';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        
        // Handle YYYYMMDD format
        if (/^\d{8}$/.test(dateStr)) {
            const year = dateStr.substr(0, 4);
            const month = dateStr.substr(4, 2);
            const day = dateStr.substr(6, 2);
            return `${month}/${day}/${year}`;
        }
        
        return dateStr;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeDownloader();
});

// Add smooth scrolling for all anchor links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add parallax effect to background
let ticking = false;

function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero-section');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
    
    ticking = false;
}

function requestParallaxUpdate() {
    if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
    }
}

window.addEventListener('scroll', requestParallaxUpdate);