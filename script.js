import { creatives } from './creatives.js';

const directory = document.getElementById('directory');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');
const counter = document.getElementById('counter');

// Drawer Elements
const drawer = document.getElementById('quickView');
const drawerBody = document.getElementById('drawerBody');
const drawerContent = document.querySelector('.drawer-content');
const closeDrawerBtn = document.querySelector('.close-drawer');
const drawerOverlay = document.querySelector('.drawer-overlay');

let displayedCreatives = [];
let currentFilteredData = []; 

// Reusable SVG Star Component (Updated to Gold)
const VERIFIED_STAR_SVG = `
    <svg class="verified-star" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #FFD700; display: inline-block; vertical-align: middle; margin-left: 6px; filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.4));">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
`;

/**
 * FEATURE: Automated Expiry Logic
 */
function isUserPro(person) {
    if (!person.expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = person.expiryDate.split('-').map(Number);
    const expiry = new Date(year, month - 1, day); 
    expiry.setHours(0, 0, 0, 0);
    return expiry >= today;
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function getSkillStyle(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash * 137.5) % 360; 
    return `background: hsla(${h}, 95%, 75%, 0.12); color: hsl(${h}, 95%, 75%); border: 1px solid hsla(${h}, 95%, 75%, 0.4); text-shadow: 0 0 8px hsla(${h}, 95%, 75%, 0.25);`;
}

/**
 * FEATURE: Skeleton Loader Template
 */
function showSkeletons() {
    directory.innerHTML = Array(8).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
        </div>
    `).join('');
}

/**
 * FEATURE: Update Filter Button Counts
 */
function updateFilterCounts() {
    filterBtns.forEach(btn => {
        const filter = btn.dataset.filter;
        let count = 0;
        if (filter === 'all') {
            count = displayedCreatives.length;
        } else {
            count = displayedCreatives.filter(p => 
                p.skills.some(s => s.toLowerCase() === filter.toLowerCase())
            ).length;
        }
        
        const label = btn.getAttribute('data-label') || btn.innerText;
        btn.setAttribute('data-label', label);
        btn.innerText = `${label} (${count})`;
    });
}

/**
 * Renders the creative cards
 */
function renderCards(data) {
    currentFilteredData = data; 
    counter.innerText = `Showcasing ${data.length} curated Filipino creatives`;

    if (data.length === 0) {
        directory.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
                <p style="font-size: 1.1rem; color: var(--text-dim); margin-bottom: 1.5rem;">No creatives found matching that search.</p>
                <button onclick="window.clearSearch()" style="background: none; border: 1px solid var(--accent); color: var(--accent); padding: 10px 24px; border-radius: 12px; cursor: pointer; font-family: inherit; transition: all 0.3s ease;">
                    Clear Search & Filters
                </button>
            </div>`;
        return;
    }

    directory.innerHTML = data.map((person, index) => {
        const isPro = isUserPro(person);
        const hasLongBio = isPro && person.longBio && person.longBio.trim() !== "";
        const badgesHTML = person.skills.map(skill => `<span class="badge" style="${getSkillStyle(skill)}">${skill}</span>`).join('');
        
        const verifiedBadge = isPro ? VERIFIED_STAR_SVG : '';
        // Fixed: Added stopPropagation to hire button
        const hireButton = isPro ? `<a href="mailto:${person.email}?subject=Inquiry: Collaboration" onclick="event.stopPropagation();" class="btn-hire">Work with Me</a>` : '';

        return `
            <div class="card ${isPro ? 'is-pro' : ''}" style="animation-delay: ${index * 0.05}s; cursor: pointer;" data-index="${index}">
                <div class="profile-img"><img src="${person.image}" alt="${person.name}" loading="lazy"></div>
                <div class="badge-container">${badgesHTML}</div>
                <h3 style="display: flex; align-items: center; gap: 4px;">${person.name} ${verifiedBadge}</h3>
                <div class="bio-wrapper">
                    <p class="bio">
                        ${person.bio}
                        ${hasLongBio ? `<span class="more-text" id="more-${index}">${person.longBio}</span>` : ''}
                    </p>
                    ${hasLongBio ? `<button class="read-more-btn" onclick="event.stopPropagation(); toggleBio(${index}, this)">Read More</button>` : ''}
                </div>
                ${hireButton}
                <div class="social-links">
                    ${person.email ? `<a href="mailto:${person.email}" onclick="event.stopPropagation();" class="social-link-item">email</a>` : ''}
                    ${Object.entries(person.links).slice(0, 2).map(([platform, url]) => `
                        <a href="${url}" target="_blank" onclick="event.stopPropagation();" class="social-link-item">${platform}</a>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Quick View Logic
 */
function openQuickView(person) {
    if (!drawer || !drawerBody) return;

    const isPro = isUserPro(person);
    
    if (isPro) {
        drawerContent.classList.add('is-pro');
    } else {
        drawerContent.classList.remove('is-pro');
    }

    drawerBody.innerHTML = `
        <div class="drawer-header">
            <img src="${person.image}" alt="${person.name}" class="drawer-img">
            <h2 class="drawer-name" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                ${person.name} 
                ${isPro ? VERIFIED_STAR_SVG.replace('width="18" height="18"', 'width="24" height="24"') : ''}
            </h2>
            <div class="badge-container" style="justify-content: center; mask-image: none; -webkit-mask-image: none; overflow: visible; flex-wrap: wrap;">
                ${person.skills.map(s => `<span class="badge" style="${getSkillStyle(s)}">${s}</span>`).join('')}
            </div>
        </div>
        
        <div class="drawer-section" style="margin-bottom: 2.5rem;">
            <p class="drawer-section-title">About</p>
            <p class="drawer-longbio">${person.longBio || person.bio}</p>
        </div>

        <div class="drawer-section">
            <p class="drawer-section-title">Connect</p>
            <div class="social-links" style="border: none; padding: 0;">
                ${Object.entries(person.links).map(([platform, url]) => `
                    <a href="${url}" target="_blank" class="social-link-item">${platform}</a>
                `).join('')}
                ${person.email ? `<a href="mailto:${person.email}" class="social-link-item">Email</a>` : ''}
            </div>
        </div>

        <a href="mailto:${person.email}" class="btn-hire" style="margin-top: 4rem; padding: 16px; font-size: 0.9rem;">
            Work with ${person.name.split(' ')[0]}
        </a>
    `;
    
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden'; 
}

const closeDrawer = () => {
    drawer.classList.remove('is-open');
    document.body.style.overflow = 'auto';
};

/**
 * Mobile Swipe-to-Close
 */
let touchStartY = 0;
if (drawerContent) {
    drawerContent.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    drawerContent.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchEndY - touchStartY > 100 && drawerContent.scrollTop <= 0) {
            closeDrawer();
        }
    }, { passive: true });
}

window.toggleBio = (index, btn) => {
    const moreText = document.getElementById(`more-${index}`);
    if (moreText) {
        const isExpanded = moreText.classList.toggle('visible');
        btn.innerText = isExpanded ? "Read Less" : "Read More";
    }
};

function filterGallery() {
    const query = searchInput.value.toLowerCase().trim();
    const activeBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeBtn ? activeBtn.dataset.filter : 'all';

    const filtered = displayedCreatives.filter(person => {
        const matchesSearch = person.name.toLowerCase().includes(query) || 
                             person.bio.toLowerCase().includes(query) ||
                             (person.longBio && person.longBio.toLowerCase().includes(query)) ||
                             person.skills.some(s => s.toLowerCase().includes(query));
        let matchesFilter = activeFilter === 'all' || person.skills.some(skill => skill.toLowerCase() === activeFilter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    renderCards(filtered);
}

window.clearSearch = () => {
    searchInput.value = '';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    filterGallery();
};

// Event Listeners
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterGallery, 150);
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterGallery();
    });
});

directory.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || e.target.closest('.btn-hire') || e.target.closest('.social-links') || e.target.closest('.read-more-btn')) return;
    const index = card.getAttribute('data-index');
    if (currentFilteredData[index]) openQuickView(currentFilteredData[index]);
});

if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
if (drawerOverlay) drawerOverlay.onclick = closeDrawer;

/**
 * FEATURE: Mobile FAB Fade-out
 */
function initFooterObserver() {
    const fab = document.querySelector('.fab');
    const footer = document.querySelector('footer');
    
    if (!fab || !footer) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                fab.classList.add('fab-hidden');
            } else {
                fab.classList.remove('fab-hidden');
            }
        });
    }, { threshold: 0.1 });

    observer.observe(footer);
}

/**
 * Initial Initialization
 */
function initializeGallery() {
    showSkeletons(); 

    setTimeout(() => {
        const activePros = shuffle([...creatives.filter(c => isUserPro(c))]);
        const regulars = shuffle([...creatives.filter(c => !isUserPro(c))]);

        displayedCreatives = [...activePros, ...regulars]; 
        renderCards(displayedCreatives);
        updateFilterCounts(); 
        initStickyObserver();
        initFooterObserver(); 
    }, 800);
}

function initStickyObserver() {
    const filterContainer = document.querySelector('.filter-container');
    const observer = new IntersectionObserver(([e]) => e.target.classList.toggle('is-pinned', e.intersectionRatio < 1), { threshold: [1], rootMargin: '-1px 0px 0px 0px' });
    if (filterContainer) observer.observe(filterContainer);
}

document.addEventListener('DOMContentLoaded', initializeGallery);

// Modal Logic
const modal = document.getElementById("pricingModal");
const openModalBtn = document.getElementById("openPricing");
const ctaOpenModalBtn = document.getElementById("ctaOpenPricing");
const closeModalBtn = document.querySelector(".close-modal");
const fabBtn = document.querySelector(".fab"); 

const openModal = () => { if (modal) modal.style.display = "flex"; };
const closeModal = () => { if (modal) modal.style.display = "none"; };

if (openModalBtn) openModalBtn.onclick = openModal;
if (ctaOpenModalBtn) ctaOpenModalBtn.onclick = openModal;
if (closeModalBtn) closeModalBtn.onclick = closeModal;

window.onclick = (event) => { if (event.target === modal) closeModal(); };
