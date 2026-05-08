// Instagram-Style Reels & Posts Implementation
// Preserves existing PHOTOLOGY aesthetic

class InstagramPortfolio {
    constructor() {
        this.reels = [];
        this.posts = [];
        this.currentReelIndex = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.isTransitioning = false;
        
        this.init();
    }
    
    async init() {
        await this.loadMedia();
        this.renderReels();
        this.renderPosts();
        this.setupReelNavigation();
    }
    
    async loadMedia() {
        try {
            const response = await fetch('assets/media.json?t=' + Date.now());
            if (response.ok) {
                const mediaList = await response.json();
                
                // Separate and sort videos (reels)
                this.reels = mediaList
                    .filter(media => media.type.startsWith('video/'))
                    .sort((a, b) => {
                        const numA = parseFloat(((a.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
                        const numB = parseFloat(((b.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
                        return numA - numB;
                    });
                
                // Separate and sort images (posts)
                this.posts = mediaList
                    .filter(media => !media.type.startsWith('video/'))
                    .sort((a, b) => {
                        const numA = parseFloat(((a.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
                        const numB = parseFloat(((b.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
                        return numA - numB;
                    });
            }
        } catch (error) {
            console.error('Error loading media:', error);
        }
    }
    
    renderReels() {
        const reelsGrid = document.getElementById('reelsGrid');
        if (!reelsGrid || this.reels.length === 0) return;
        
        reelsGrid.innerHTML = this.reels.map((reel, index) => `
            <div class="reel-item" data-index="${index}">
                <video 
                    class="reel-video"
                    src="${reel.url}"
                    loop
                    muted
                    playsinline
                    preload="metadata"
                    data-reel-video="${index}"
                ></video>
                
                <!-- Cinematic overlay -->
                <div class="reel-overlay"></div>
                
                <!-- Right side actions -->
                <div class="reel-actions">
                    <button class="reel-action-btn" data-action="like" data-index="${index}">
                        <i class="far fa-heart"></i>
                        <span class="reel-action-count">1.2K</span>
                    </button>
                    <button class="reel-action-btn" data-action="comment" data-index="${index}">
                        <i class="far fa-comment"></i>
                        <span class="reel-action-count">234</span>
                    </button>
                    <button class="reel-action-btn" data-action="share" data-index="${index}">
                        <i class="far fa-paper-plane"></i>
                        <span class="reel-action-count">89</span>
                    </button>
                    <button class="reel-action-btn" data-action="save" data-index="${index}">
                        <i class="far fa-bookmark"></i>
                    </button>
                    <button class="reel-action-btn" data-action="mute" data-index="${index}">
                        <i class="fas fa-volume-mute"></i>
                    </button>
                </div>
                
                <!-- Bottom content -->
                <div class="reel-content">
                    <div class="reel-profile">
                        <div class="reel-avatar">
                            <i class="fas fa-user" style="color: white; font-size: 0.875rem;"></i>
                        </div>
                        <span class="reel-username">@photology_.009</span>
                        <button class="reel-follow-btn">Follow</button>
                    </div>
                    <p class="reel-caption">Premium cinematic content 🎬✨</p>
                    <div class="reel-audio">
                        <i class="fas fa-music"></i>
                        <span>Original Audio</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Setup action buttons
        this.setupReelActions();
        
        // Play first reel
        this.playReel(0);
    }
    
    renderPosts() {
        const postsGrid = document.getElementById('postsGrid');
        if (!postsGrid || this.posts.length === 0) return;
        
        postsGrid.innerHTML = this.posts.map((post, index) => `
            <div class="post-item">
                <!-- Header -->
                <div class="post-header">
                    <div class="post-avatar">
                        <i class="fas fa-user" style="color: white; font-size: 0.875rem;"></i>
                    </div>
                    <div class="post-user-info">
                        <div class="post-username">@photology_.009</div>
                        <div class="post-location">Surat, Gujarat</div>
                    </div>
                    <button class="post-action-btn">
                        <i class="fas fa-ellipsis-h" style="color: white;"></i>
                    </button>
                </div>
                
                <!-- Image - 4:5 ratio -->
                <div class="post-image-container">
                    <img 
                        src="${post.url}" 
                        alt="Post ${index + 1}"
                        class="post-image"
                        loading="lazy"
                    />
                </div>
                
                <!-- Actions -->
                <div class="post-actions">
                    <div class="post-actions-left">
                        <button class="post-action-btn" data-post-action="like" data-index="${index}">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="post-action-btn" data-post-action="comment" data-index="${index}">
                            <i class="far fa-comment"></i>
                        </button>
                        <button class="post-action-btn" data-post-action="share" data-index="${index}">
                            <i class="far fa-paper-plane"></i>
                        </button>
                    </div>
                    <button class="post-action-btn" data-post-action="save" data-index="${index}">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="post-content">
                    <div class="post-likes">1,234 likes</div>
                    <div class="post-caption">
                        <span class="post-caption-username">@photology_.009</span>
                        <span class="post-caption-text">Premium content ✨</span>
                    </div>
                    <a href="#" class="post-comments-link">View all 45 comments</a>
                    <div class="post-time">2 HOURS AGO</div>
                </div>
            </div>
        `).join('');
        
        // Setup post actions
        this.setupPostActions();
    }
    
    setupReelNavigation() {
        const reelsGrid = document.getElementById('reelsGrid');
        if (!reelsGrid) return;
        
        // Horizontal scroll for reels (like posts)
        let scrollTimeout;
        reelsGrid.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveReel();
            }, 150);
        });
        
        // Play video on hover
        document.querySelectorAll('.reel-item').forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                const video = item.querySelector('.reel-video');
                if (video) video.play().catch(() => {});
            });
            
            item.addEventListener('mouseleave', () => {
                const video = item.querySelector('.reel-video');
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        });
    }
    
    updateActiveReel() {
        const reelsGrid = document.getElementById('reelsGrid');
        if (!reelsGrid) return;
        
        // Find the reel closest to center
        const scrollLeft = reelsGrid.scrollLeft;
        const cardWidth = 320; // reel-item width
        const gap = 24; // gap between cards
        const newIndex = Math.round(scrollLeft / (cardWidth + gap));
        
        if (newIndex !== this.currentReelIndex && newIndex < this.reels.length) {
            this.currentReelIndex = newIndex;
            // Optional: auto-play centered reel
            // this.playReel(newIndex);
        }
    }
    
    playReel(index) {
        // Pause all videos
        document.querySelectorAll('[data-reel-video]').forEach(video => {
            video.pause();
        });
        
        // Play current video
        const currentVideo = document.querySelector(`[data-reel-video="${index}"]`);
        if (currentVideo) {
            currentVideo.play().catch(() => {});
        }
    }
    
    setupReelActions() {
        // Like button
        document.querySelectorAll('[data-action="like"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const icon = btn.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    btn.classList.add('liked');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    btn.classList.remove('liked');
                }
            });
        });
        
        // Mute button
        document.querySelectorAll('[data-action="mute"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                const video = document.querySelector(`[data-reel-video="${index}"]`);
                const icon = btn.querySelector('i');
                
                if (video) {
                    video.muted = !video.muted;
                    icon.className = video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
                }
            });
        });
        
        // Other actions (comment, share, save)
        ['comment', 'share', 'save'].forEach(action => {
            document.querySelectorAll(`[data-action="${action}"]`).forEach(btn => {
                btn.addEventListener('click', () => {
                    console.log(`${action} clicked`);
                    // Add your action logic here
                });
            });
        });
    }
    
    setupPostActions() {
        // Like button
        document.querySelectorAll('[data-post-action="like"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const icon = btn.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    btn.classList.add('liked');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    btn.classList.remove('liked');
                }
            });
        });
        
        // Save button
        document.querySelectorAll('[data-post-action="save"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const icon = btn.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            });
        });
        
        // Other actions
        ['comment', 'share'].forEach(action => {
            document.querySelectorAll(`[data-post-action="${action}"]`).forEach(btn => {
                btn.addEventListener('click', () => {
                    console.log(`${action} clicked`);
                    // Add your action logic here
                });
            });
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new InstagramPortfolio();
    });
} else {
    new InstagramPortfolio();
}
