// ===== DYNAMIC CONTENT LOADING FROM ADMIN PANEL =====
async function loadDynamicContent() {
    try {
        console.log('🔄 Loading dynamic content from admin panel...');
        
        // Load settings from localStorage
        const settings = JSON.parse(localStorage.getItem('website_settings')) || null;
        const pricingPlans = JSON.parse(localStorage.getItem('pricing_plans')) || null;
        
        // 1. Try to load media from physical media.json (Works on GitHub Pages & Local Server)
        let physicalMedia = [];
        try {
            const response = await fetch('assets/media.json?t=' + Date.now()); // cache bust
            if (response.ok) {
                physicalMedia = await response.json();
            }
        } catch(e) { 
            console.warn('No media.json found or fetch failed'); 
        }
        
        // 2. Load from localforage (IndexedDB - Admin panel uploads)
        let localMedia = await localforage.getItem('uploaded_media') || [];
        
        // Combine both sources, avoiding duplicates by URL
        const allMedia = [...physicalMedia, ...localMedia];
        const uniqueUrls = new Set();
        let uploadedMedia = allMedia.filter(m => {
            if (uniqueUrls.has(m.url)) return false;
            uniqueUrls.add(m.url);
            return true;
        });
        
        if (settings) {
            console.log('✅ Settings found:', settings);
            
            // Update Contact Info
            if (settings.contact) {
                updateContactInfo(settings.contact);
            }
            
            // Update Stats
            if (settings.stats) {
                updateStats(settings.stats);
            }
            
            // Update Content
            if (settings.content) {
                updateContent(settings.content);
            }
            
            // Update Social Links
            if (settings.social) {
                updateSocialLinks(settings.social);
            }
        }
        
// Update Portfolio - ONLY from Uploaded Media
        if (uploadedMedia && uploadedMedia.length > 0) {
            console.log('✅ Uploaded media found:', uploadedMedia.length);
            updatePortfolioFromMedia(uploadedMedia);
        } else {
            console.log('ℹ️ No uploaded media found, auto-adding project files...');
            // Auto-add project files on first load
            autoAddProjectFiles();
        }
        
        // Update Pricing
        if (pricingPlans && pricingPlans.length > 0) {
            console.log('✅ Pricing plans found:', pricingPlans.length);
            updatePricing(pricingPlans);
        } else {
            console.log('ℹ️ No pricing plans in localStorage, keeping default HTML');
        }
    } catch (error) {
        console.error('❌ Error loading dynamic content:', error);
    }
}

// Update Contact Information
function updateContactInfo(contact) {
    try {
        // Update email
        document.querySelectorAll('[href^="mailto:"]').forEach(el => {
            el.href = `mailto:${contact.email}`;
            if (el.textContent.includes('@')) {
                el.textContent = contact.email;
            }
        });
        
        // Update phone
        document.querySelectorAll('[href^="tel:"]').forEach(el => {
            el.href = `tel:${contact.phone.replace(/\s/g, '')}`;
            if (el.textContent.includes('+')) {
                el.textContent = contact.phone;
            }
        });
        
        // Update WhatsApp
        document.querySelectorAll('[href*="wa.me"]').forEach(el => {
            el.href = `https://wa.me/${contact.whatsapp}`;
        });
        
        // Update location text
        const locationElements = document.querySelectorAll('.contact-item span');
        locationElements.forEach(el => {
            if (el.textContent.includes('Surat') || el.textContent.includes('Gujarat')) {
                el.textContent = contact.location;
            }
        });
        
        console.log('✅ Contact info updated');
    } catch (error) {
        console.error('❌ Error updating contact info:', error);
    }
}

// Update Stats
function updateStats(stats) {
    try {
        const statsCards = document.querySelectorAll('.stat-card');
        
        if (statsCards.length >= 4) {
            // Projects
            const projectsValue = statsCards[0].querySelector('.stat-number');
            if (projectsValue) projectsValue.textContent = stats.projects;
            
            // Views
            const viewsValue = statsCards[1].querySelector('.stat-number');
            if (viewsValue) viewsValue.textContent = stats.views;
            
            // Clients
            const clientsValue = statsCards[2].querySelector('.stat-number');
            if (clientsValue) clientsValue.textContent = stats.clients;
            
            // Experience
            const experienceValue = statsCards[3].querySelector('.stat-number');
            if (experienceValue) experienceValue.textContent = stats.experience;
        }
        
        console.log('✅ Stats updated');
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

// Update Content (Hero & About)
function updateContent(content) {
    // Update hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) heroTitle.textContent = content.heroTitle;
    
    // Update hero subtitle
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) heroSubtitle.textContent = content.heroSubtitle;
    
    // Update about text
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        // Convert line breaks to paragraphs
        const paragraphs = content.aboutText.split('\n\n');
        aboutText.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
    }
    
    console.log('✅ Content updated');
}

// Update Social Links
function updateSocialLinks(social) {
    // Update Instagram links
    document.querySelectorAll('[href*="instagram.com"]').forEach(el => {
        if (!el.closest('.portfolio-item')) { // Skip portfolio items
            el.href = social.instagramUrl;
        }
    });
    
    // Update Instagram handle text
    const instagramHandles = document.querySelectorAll('a[href*="instagram.com"]');
    instagramHandles.forEach(el => {
        if (el.textContent.includes('@')) {
            el.textContent = social.instagramHandle;
        }
    });
    
    console.log('✅ Social links updated');
}

// Update Portfolio
function updatePortfolio(items) {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = items.map((item, index) => `
        <div class="portfolio-item fade-in" data-reel="${item.url}">
            <div class="portfolio-overlay">
                <i class="fab fa-instagram"></i>
                <p>View Reel</p>
            </div>
            <img src="${item.image}" alt="Portfolio ${index + 1}" 
                 onerror="this.src='https://via.placeholder.com/400x600/111111/D4AF37?text=Portfolio+${index + 1}'">
        </div>
    `).join('');
    
    // Re-attach event listeners for new portfolio items
    attachPortfolioListeners();
    
    console.log('✅ Portfolio updated');
}

// Update Portfolio from Uploaded Media (Images & Videos)
// Update Portfolio from Uploaded Media (Images & Videos) - CLEAN RENDER
function updatePortfolioFromMedia(mediaList) {
    const portfolioGrid = document.getElementById('portfolioGrid'); // Reels
    const postsGrid = document.getElementById('postsGrid'); // Posts
    
    if (!portfolioGrid) return;
    
    // Clear all existing content
    portfolioGrid.innerHTML = '';
    if (postsGrid) postsGrid.innerHTML = '';
    
    // Check if media list is empty
    if (!mediaList || mediaList.length === 0) {
        portfolioGrid.innerHTML = `
            <div class="glass-card" style="padding: 3rem; text-align: center; grid-column: 1 / -1;">
                <i class="fas fa-video" style="font-size: 3rem; color: var(--gold); opacity: 0.5;"></i>
                <p style="margin-top: 1rem; color: var(--text-secondary);">No reels yet</p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Upload video media from admin panel</p>
            </div>
        `;
        if (postsGrid) {
            postsGrid.innerHTML = `
                <div class="glass-card" style="padding: 3rem; text-align: center; grid-column: 1 / -1;">
                    <i class="fas fa-images" style="font-size: 3rem; color: var(--gold); opacity: 0.5;"></i>
                    <p style="margin-top: 1rem; color: var(--text-secondary);">No posts yet</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Upload image media from admin panel</p>
                </div>
            `;
        }
        return;
    }
    
    // Separate media into videos and images
    const videos = mediaList.filter(media => media.type.startsWith('video/'));
    const images = mediaList.filter(media => !media.type.startsWith('video/'));
    
    // Sort videos by number in the filename
    videos.sort((a, b) => {
        const numA = parseFloat(((a.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
        const numB = parseFloat(((b.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
        return numA - numB;
    });
    
    // Sort images by number in the filename
    images.sort((a, b) => {
        const numA = parseFloat(((a.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
        const numB = parseFloat(((b.name || '').match(/\d+(\.\d+)?/) || [Infinity])[0]);
        return numA - numB;
    });

    // Helper to create a card
    function createCard(media, index) {
        const card = document.createElement('div');
        card.className = 'portfolio-item fade-in';
        card.setAttribute('data-media-url', media.url);
        card.setAttribute('data-is-video', media.type.startsWith('video/'));
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'portfolio-overlay';
        overlay.innerHTML = `
            <i class="fas fa-${media.type.startsWith('video/') ? 'play' : 'eye'}"></i>
            <p>${media.type.startsWith('video/') ? 'Play Video' : 'View Image'}</p>
        `;
        
        // Create media element - use direct src for reliable playback
        if (media.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = encodeURI(media.url);
            video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            video.muted = true;
            video.preload = 'metadata';
            video.playsInline = true;
            video.autoplay = true;
            video.loop = true;
            
            // Set video to first frame on load
            video.addEventListener('loadedmetadata', function() {
                this.currentTime = 0.1;
            });
            
            // Error handling - hide the whole card so no blank cards appear
            video.addEventListener('error', function() {
                console.error('Video load error:', media.url);
                card.style.display = 'none';
            });
            
            // Also hide card if video stalls with no data at all
            video.addEventListener('emptied', function() {
                if (!this.src || this.networkState === 3) {
                    card.style.display = 'none';
                }
            });
            
            card.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = encodeURI(media.url);
            img.alt = media.name || `Portfolio ${index + 1}`;
            img.loading = 'lazy';
            img.onerror = function() {
                console.error('Image load error:', media.url);
                this.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Crect fill='%23111' width='400' height='600'/%3E%3Ctext x='50%25' y='50%25' fill='%23D4AF37' text-anchor='middle' dy='.3em' font-family='Arial' font-size='20'%3EImage Error%3C/text%3E%3C/svg%3E`;
            };
            
            card.appendChild(img);
        }
        
        card.appendChild(overlay);
        return card;
    }

    // Render Videos
    if (videos.length > 0) {
        videos.forEach((media, index) => {
            portfolioGrid.appendChild(createCard(media, index));
        });
    } else {
        portfolioGrid.innerHTML = `<div class="glass-card" style="padding: 3rem; text-align: center; grid-column: 1 / -1;"><p style="color: var(--text-secondary);">No reels yet</p></div>`;
    }

    // Render Images
    if (postsGrid) {
        if (images.length > 0) {
            images.forEach((media, index) => {
                postsGrid.appendChild(createCard(media, index));
            });
        } else {
            postsGrid.innerHTML = `<div class="glass-card" style="padding: 3rem; text-align: center; grid-column: 1 / -1;"><p style="color: var(--text-secondary);">No posts yet</p></div>`;
        }
    }
    
    // Attach click listeners for media viewing
    attachMediaPortfolioListeners();
    
    console.log('✅ Portfolio rendered: Reels (' + videos.length + '), Posts (' + images.length + ')');
}

// Attach event listeners for media portfolio items
function attachMediaPortfolioListeners() {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    portfolioItems.forEach(item => {
        item.addEventListener('click', () => {
            const mediaUrl = item.getAttribute('data-media-url');
            const isVideo = item.getAttribute('data-is-video') === 'true';
            
            // Open media in modal or new tab
            if (isVideo) {
                openVideoModal(mediaUrl);
            } else {
                openImageModal(mediaUrl);
            }
        });
    });
}

// Open video in modal - simple native player (reliable)
function openVideoModal(videoUrl) {
    const reelModal = document.getElementById('reelModal');
    const reelEmbed = document.getElementById('reelEmbed');
    
    if (reelModal && reelEmbed) {
        reelEmbed.innerHTML = `
            <video controls autoplay muted playsinline>
                <source src="${encodeURI(videoUrl)}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
        reelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Autoplay
        const vid = reelEmbed.querySelector('video');
        if (vid) vid.play().catch(() => {});
    } else {
        window.open(videoUrl, '_blank');
    }
}

// Open image in modal
function openImageModal(imageUrl) {
    const reelModal = document.getElementById('reelModal');
    const reelEmbed = document.getElementById('reelEmbed');
    
    if (reelModal && reelEmbed) {
        reelEmbed.innerHTML = `
            <img src="${encodeURI(imageUrl)}" alt="Portfolio Image">
        `;
        reelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        window.open(imageUrl, '_blank');
    }
}

// Update Pricing
function updatePricing(plans) {
    const pricingGrid = document.querySelector('.pricing-grid');
    if (!pricingGrid) return;
    
    pricingGrid.innerHTML = plans.map((plan, index) => {
        const isFeatured = plan.featured || index === 1; // Middle card is featured
        
        return `
            <div class="glass-card pricing-card ${isFeatured ? 'featured' : ''} fade-in">
                ${isFeatured ? '<div class="featured-badge">POPULAR</div>' : ''}
                <div class="pricing-header ${isFeatured ? 'pricing-header-featured' : ''}">
                    <h3 class="pricing-title">${plan.name}</h3>
                    <p class="pricing-tagline">${getTagline(plan.name)}</p>
                </div>
                <div class="pricing-body">
                    <ul class="pricing-features">
                        ${plan.features.map(feature => `
                            <li><i class="fas fa-check"></i> ${feature}</li>
                        `).join('')}
                    </ul>
                    <a href="#contact" class="pricing-button ${isFeatured ? 'pricing-button-filled' : 'pricing-button-outline'}">
                        <span>Contact Now</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ Pricing updated');
}

// Get tagline based on plan name
function getTagline(planName) {
    const taglines = {
        'Starter': 'Start Your Journey',
        'Growth': 'Best For Scaling Brands',
        'Premium': 'Complete Brand Solution'
    };
    return taglines[planName] || 'Perfect For You';
}

// Re-attach portfolio event listeners
function attachPortfolioListeners() {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const reelModal = document.getElementById('reelModal');
    const reelEmbed = document.getElementById('reelEmbed');
    
    portfolioItems.forEach(item => {
        item.addEventListener('click', () => {
            const reelUrl = item.getAttribute('data-reel');
            const postId = extractReelId(reelUrl);
            
            if (postId) {
                const embedCode = `
                    <blockquote class="instagram-media" 
                        data-instgrm-permalink="${reelUrl}" 
                        data-instgrm-version="14"
                        style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
                    </blockquote>
                `;
                
                reelEmbed.innerHTML = embedCode;
                reelModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                if (!window.instgrm) {
                    const script = document.createElement('script');
                    script.async = true;
                    script.src = 'https://www.instagram.com/embed.js';
                    document.body.appendChild(script);
                } else {
                    window.instgrm.Embeds.process();
                }
            } else {
                window.open(reelUrl, '_blank');
            }
        });
    });
}

// Load dynamic content on page load
window.addEventListener('DOMContentLoaded', loadDynamicContent);

// Listen for storage changes (when admin updates data)
window.addEventListener('storage', (e) => {
    if (e.key === 'website_settings' || e.key === 'pricing_plans' || e.key === 'uploaded_media') {
        console.log('🔄 Admin panel updated data, reloading...');
        loadDynamicContent();
    }
});

// ===== SMOOTH SCROLL & NAVIGATION =====
document.addEventListener('DOMContentLoaded', () => {
    const navItems     = document.querySelectorAll('.nav-item');
    const navIndicator = document.querySelector('.nav-indicator');
    const ambientGlow  = document.querySelector('.nav-ambient-glow');

    // Only track sections that have a matching nav link
    const navHrefs = Array.from(navItems).map(n => n.getAttribute('href').replace('#', ''));

    /* ── Indicator hidden (active bg is CSS-only on item) ── */
    function updateNavIndicator() {
        // No-op: nav-indicator & nav-ambient-glow are display:none in new design.
        // Active state is handled purely via .active class CSS.
    }

    /* ── Ripple burst on click ── */
    function triggerRipple(item) {
        item.classList.remove('ripple-active');
        void item.offsetWidth;
        item.classList.add('ripple-active');
        setTimeout(() => item.classList.remove('ripple-active'), 600);
    }

    /* ── Smooth scroll with nav bar offset ── */
    function scrollToSection(targetId) {
        const target = document.querySelector(targetId);
        if (!target) return;

        // Get nav bar height for offset
        const nav = document.getElementById('bottomNav');
        const navH = nav ? nav.offsetHeight + 20 : 80;

        const top = target.getBoundingClientRect().top + window.pageYOffset - navH;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    /* ── Set active nav item ── */
    function setActiveNav(targetHref) {
        navItems.forEach(nav => {
            const wasActive    = nav.classList.contains('active');
            const willBeActive = nav.getAttribute('href') === targetHref;

            if (willBeActive && !wasActive) {
                nav.classList.remove('active');
                void nav.offsetWidth;
                nav.classList.add('active');
            } else if (!willBeActive) {
                nav.classList.remove('active');
            }
        });
        updateNavIndicator();
    }

    /* ── Scroll-based active detection (only nav-linked sections) ── */
    window.addEventListener('scroll', () => {
        // Only consider sections with a matching nav href
        const sections = Array.from(document.querySelectorAll('section[id]'))
            .filter(s => navHrefs.includes(s.getAttribute('id')));

        let current = '';
        const scrollMid = window.pageYOffset + window.innerHeight / 3;

        sections.forEach(section => {
            if (section.offsetTop <= scrollMid) {
                current = section.getAttribute('id');
            }
        });

        if (current) setActiveNav(`#${current}`);
        else setActiveNav('#home');
    }, { passive: true });

    /* ── Click to scroll + ripple ── */
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            triggerRipple(item);
            setActiveNav(item.getAttribute('href'));
            scrollToSection(item.getAttribute('href'));
        });

        /* ── Magnetic hover on desktop ── */
        item.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 640) return;
            const rect   = item.getBoundingClientRect();
            const mx     = e.clientX - rect.left - rect.width  / 2;
            const my     = e.clientY - rect.top  - rect.height / 2;
            const wrap   = item.querySelector('.nav-icon-wrap');
            if (wrap && !item.classList.contains('active')) {
                wrap.style.transform = `translate(${mx * 0.18}px, ${my * 0.18 - 3}px) scale(1.08)`;
            }
        });

        item.addEventListener('mouseleave', () => {
            const wrap = item.querySelector('.nav-icon-wrap');
            if (wrap && !item.classList.contains('active')) {
                wrap.style.transform = '';
            }
        });
    });

    /* ── Resize ── */
    window.addEventListener('resize', updateNavIndicator);

    /* ── Initial placement ── */
    window.addEventListener('load', updateNavIndicator);
    setTimeout(updateNavIndicator, 300);
});

// ===== FADE-IN ANIMATION ON SCROLL =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// ===== PORTFOLIO REEL MODAL =====
const portfolioItems = document.querySelectorAll('.portfolio-item');
const reelModal = document.getElementById('reelModal');
const closeModal = document.getElementById('closeModal');
const reelEmbed = document.getElementById('reelEmbed');

portfolioItems.forEach(item => {
    item.addEventListener('click', () => {
        const reelUrl = item.getAttribute('data-reel');
        console.log('Portfolio item clicked, URL:', reelUrl);
        
        // Extract Instagram post/reel ID from URL
        const postId = extractReelId(reelUrl);
        console.log('Extracted post ID:', postId);
        
        if (postId) {
            // Create Instagram embed with proper sizing
            const embedCode = `
                <blockquote class="instagram-media" 
                    data-instgrm-permalink="${reelUrl}" 
                    data-instgrm-version="14"
                    style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
                </blockquote>
            `;
            
            reelEmbed.innerHTML = embedCode;
            reelModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            console.log('Modal opened, loading Instagram embed...');
            
            // Load Instagram embed script if not already loaded
            if (!window.instgrm) {
                console.log('Loading Instagram embed script...');
                const script = document.createElement('script');
                script.async = true;
                script.src = 'https://www.instagram.com/embed.js';
                script.onload = () => {
                    console.log('Instagram embed script loaded successfully');
                };
                document.body.appendChild(script);
            } else {
                console.log('Instagram embed script already loaded, processing...');
                // Reload Instagram embed script
                window.instgrm.Embeds.process();
            }
        } else {
            console.log('Could not extract post ID, opening in new tab');
            // Fallback: open in new tab if embed fails
            window.open(reelUrl, '_blank');
        }
    });
});

// Close modal
if (closeModal) {
    closeModal.addEventListener('click', closeReelModal);
}

if (reelModal) {
    reelModal.addEventListener('click', (e) => {
        // Close when clicking the dark backdrop (outside the modal content box)
        if (e.target === reelModal) {
            closeReelModal();
        }
    });
}

function closeReelModal() {
    reelModal.classList.remove('active');
    reelEmbed.innerHTML = '';
    document.body.style.overflow = 'auto';
}

// Extract reel ID from Instagram URL
function extractReelId(url) {
    const patterns = [
        /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
        /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
        /instagr\.am\/reel\/([A-Za-z0-9_-]+)/,
        /instagr\.am\/p\/([A-Za-z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reelModal && reelModal.classList.contains('active')) {
        closeReelModal();
    }
});

// ===== CONTACT FORM =====
// Contact form handling moved to index.html (Firebase integration)
// Removed duplicate declaration to avoid conflict

// ===== PARALLAX EFFECT FOR HERO IMAGE =====
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroSilhouette = document.querySelector('.hero-silhouette');
    
    if (heroSilhouette && scrolled < window.innerHeight) {
        heroSilhouette.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// ===== SMOOTH SCROLL POLYFILL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ===== LOADING ANIMATION =====
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Trigger initial fade-in for hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        setTimeout(() => {
            heroContent.classList.add('visible');
        }, 300);
    }
    
    // Attach media portfolio listeners for local videos
    attachMediaPortfolioListeners();
});

// ===== PERFORMANCE OPTIMIZATION =====
// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===== CONSOLE BRANDING =====
console.log('%cPHOTOLOGY', 'font-size: 40px; font-weight: bold; background: linear-gradient(135deg, #D4AF37, #FF8C42); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cCinematic Content Agency', 'font-size: 16px; color: #D4AF37;');
console.log('%cWebsite inspired by premium portfolio design', 'font-size: 12px; color: #b0b0b0;');

// ===== HORIZONTAL SCROLL - CENTER CARD HIGHLIGHT =====
function initHorizontalScroll() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const pricingGrid = document.querySelector('.pricing-grid');
    
    // Only apply on mobile (max-width: 767px)
    if (window.innerWidth <= 767) {
        // Portfolio scroll highlight
        if (portfolioGrid) {
            portfolioGrid.addEventListener('scroll', () => {
                highlightCenterCard(portfolioGrid, '.portfolio-item');
            });
            // Initial highlight
            highlightCenterCard(portfolioGrid, '.portfolio-item');
        }
        
        // Pricing scroll highlight
        if (pricingGrid) {
            pricingGrid.addEventListener('scroll', () => {
                highlightCenterCard(pricingGrid, '.pricing-card');
            });
            // Initial highlight
            highlightCenterCard(pricingGrid, '.pricing-card');
        }
    }
}

function highlightCenterCard(container, cardSelector) {
    const cards = container.querySelectorAll(cardSelector);
    const containerCenter = container.offsetLeft + container.offsetWidth / 2;
    
    cards.forEach(card => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2 - container.scrollLeft;
        const distance = Math.abs(containerCenter - cardCenter);
        
        // Card is in center (within threshold)
        if (distance < container.offsetWidth / 3) {
            card.style.transform = 'scale(1)';
            card.style.opacity = '1';
        } else {
            card.style.transform = 'scale(0.92)';
            card.style.opacity = '0.7';
        }
    });
}

// Initialize on load
if (window.innerWidth <= 767) {
    window.addEventListener('load', initHorizontalScroll);
}

// Re-initialize on resize (if switching to/from mobile)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window.innerWidth <= 767) {
            initHorizontalScroll();
        } else {
            // Reset styles on desktop
            document.querySelectorAll('.portfolio-item, .pricing-card').forEach(card => {
                card.style.transform = '';
                card.style.opacity = '';
            });
        }
    }, 250);
});

// ===== CURSOR EFFECT (OPTIONAL) =====
const createCursorGlow = () => {
    const cursor = document.createElement('div');
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(212, 175, 55, 0.3), transparent);
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        filter: blur(10px);
        transition: width 0.2s, height 0.2s;
    `;
    
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    
    // Hide on mobile
    if (window.innerWidth <= 768) {
        cursor.style.display = 'none';
    }
};

// Initialize cursor glow on desktop only
if (window.innerWidth > 768) {
    createCursorGlow();
}

// ===== BOTTOM NAV SCROLL HIDE LOGIC =====
let lastScrollTop = window.scrollY || document.documentElement.scrollTop;
const bottomNavbar = document.querySelector('.bottom-nav');

window.addEventListener('scroll', () => {
    if (!bottomNavbar) return;
    
    const scrollTopPosition = window.scrollY || document.documentElement.scrollTop;
    
    // Always show at the very top
    if (scrollTopPosition < 50) {
        bottomNavbar.classList.remove('hidden');
    } 
    // Scroll down: hide
    else if (scrollTopPosition > lastScrollTop + 5) {
        bottomNavbar.classList.add('hidden');
    } 
    // Scroll up: show
    else if (scrollTopPosition < lastScrollTop - 5) {
        bottomNavbar.classList.remove('hidden');
    }
    
    lastScrollTop = scrollTopPosition <= 0 ? 0 : scrollTopPosition;
}, { passive: true });
// ===== AUTO-ADD PROJECT FILES =====
async function autoAddProjectFiles() {
    console.log('🎬 Auto-adding project files to portfolio...');
    
    const mediaList = [];
    
    // List of all videos in assets/videos folder
    const projectVideos = [
        'vijay 1.1.mp4',
        '3.mp4',
        'lagan geet highlight 1.mp4'
    ];
    
    // List of all images in assets/images folder
    const projectImages = [
        { name: '_sufi night ( birthdat ).jpg', type: 'image/jpeg' },
        { name: '_hanumant events officia poster.png', type: 'image/png' }
    ];
    
    // Add videos
    projectVideos.forEach(videoName => {
        mediaList.push({
            name: videoName,
            url: `assets/videos/${videoName}`,
            type: 'video/mp4',
            size: 0,
            timestamp: Date.now(),
            isLocal: true,
            isProjectFile: true
        });
    });
    
    // Add images
    projectImages.forEach(image => {
        mediaList.push({
            name: image.name,
            url: `assets/images/${image.name}`,
            type: image.type,
            size: 0,
            timestamp: Date.now(),
            isLocal: true,
            isProjectFile: true
        });
    });
    
    // Save to localforage
    await localforage.setItem('uploaded_media', mediaList);
    console.log(`✅ Added ${mediaList.length} project files to portfolio`);
    
    // Update portfolio display
    updatePortfolioFromMedia(mediaList);
}
