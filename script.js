import { creatives } from './creatives.js';

// --- DOM SELECTIONS ---
const directory = document.getElementById('directory');
const searchInput = document.getElementById('search');
const searchWrapper = document.querySelector('.search-wrapper');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const counter = document.getElementById('counter');
const shareCategoryBtn = document.getElementById('shareCategoryBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Drawer Elements
const drawer = document.getElementById('quickView');
const drawerBody = document.getElementById('drawerBody');
const drawerContent = document.querySelector('.drawer-content');
const closeDrawerBtn = document.querySelector('.close-drawer');
const drawerOverlay = document.querySelector('.drawer-overlay');

// Suggestion Panel
const suggestionsPanel = document.getElementById('searchSuggestions');

// --- STATE MANAGEMENT ---
let displayedCreatives = []; // Master list: Pro first, then Regular
let currentFilteredData = []; // Currently visible list

// --- CONSTANTS ---
const VERIFIED_STAR_SVG = `
    <svg 
        class="verified-star" 
        xmlns="http://www.w3.org/2000/svg" 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        style="color: #FFD700; display: inline-block; vertical-align: middle; margin-left: 6px; filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.4));"
    >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
`;

/**
 * FEATURE: URL SLUGIFICATION
 */
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\//g, '-')   
        .replace(/\s+/g, '-')   
        .replace(/[^\w-]+/g, '') 
        .replace(/--+/g, '-')   
        .replace(/^-+/, '')     
        .replace(/-+$/, '');    
};

/**
 * FEATURE: SMART HIGHLIGHTING
 */
function highlightText(text, query) {
    if (!query || !query.trim() || !text) return text;
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * OPTIMIZATION: DEBOUNCE UTILITY
 */
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * FEATURE: INTERFACE STATE UPDATER
 * Syncs the visibility of the Reset button and the Share FAB
 */
function updateInterfaceState() {
    const query = searchInput.value.trim();
    const activeBtn = document.querySelector('.filter-btn.active');
    const filterValue = activeBtn ? activeBtn.dataset.filter : 'all';

    // 1. Reset Button Visibility
    if (clearFiltersBtn) {
        if (query !== "" || filterValue !== "all") {
            clearFiltersBtn.classList.add('is-active');
        } else {
            clearFiltersBtn.classList.remove('is-active');
        }
    }

    // 2. Share FAB Visibility
    if (shareCategoryBtn) {
        if (filterValue === 'all') {
            shareCategoryBtn.classList.remove('visible');
        } else {
            const label = activeBtn.getAttribute('data-label') || activeBtn.innerText.split(' (')[0];
            shareCategoryBtn.querySelector('span').innerText = `Share ${label}`;
            shareCategoryBtn.classList.add('visible');
        }
    }
}

/**
 * FEATURE: Filter by Skill (Clickable Badges)
 */
window.filterBySkill = (skillName) => {
    closeDrawer();
    const targetBtn = Array.from(filterBtns).find(btn =>
        btn.dataset.filter.toLowerCase() === skillName.toLowerCase()
    );

    if (targetBtn) {
        searchInput.value = '';
        if (searchWrapper) searchWrapper.classList.remove('has-text');
        filterBtns.forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');

        const url = new URL(window.location);
        url.searchParams.set('filter', slugify(skillName));
        window.history.replaceState({}, '', url);

        filterGallery();
        updateInterfaceState();
        if (suggestionsPanel) suggestionsPanel.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

/**
 * FEATURE: Dynamic Search Suggestions
 */
function showSuggestions(query) {
    if (!suggestionsPanel) return;
    if (!query || query.length < 1) {
        suggestionsPanel.style.display = 'none';
        return;
    }

    const matches = [];
    const lowerQuery = query.toLowerCase();

    creatives.forEach(p => {
        if (p.name.toLowerCase().includes(lowerQuery)) {
            matches.push({ label: p.name, type: 'Creative', value: p.name });
        }
    });

    const uniqueSkills = [...new Set(creatives.flatMap(p => p.skills))];
    uniqueSkills.forEach(skill => {
        if (skill.toLowerCase().includes(lowerQuery)) {
            matches.push({ label: skill, type: 'Skill', value: skill });
        }
    });

    const experiences = [...new Set(creatives.map(p => p.experience).filter(v => v != null))];
    experiences.forEach(exp => {
        const expStr = exp.toString();
        if (expStr.includes(lowerQuery) || ("years".includes(lowerQuery) && lowerQuery.length > 2)) {
            matches.push({ label: `${exp}+ Years Exp`, type: 'Experience', value: expStr });
        }
    });

    const uniqueLocations = [...new Set(creatives.map(p => p.location).filter(Boolean))];
    uniqueLocations.forEach(loc => {
        if (loc.toLowerCase().includes(lowerQuery)) {
            matches.push({ label: loc, type: 'Location', value: loc });
        }
    });

    const seen = new Set();
    const limitedMatches = matches.filter(el => {
        const duplicate = seen.has(el.label);
        seen.add(el.label);
        return !duplicate;
    }).slice(0, 20);

    if (limitedMatches.length > 0) {
        suggestionsPanel.innerHTML = limitedMatches.map(m => `
            <div class="suggestion-item" onclick="window.selectSuggestion('${m.value}')">
                <span class="suggestion-label">${m.label}</span>
                <span class="suggestion-type">${m.type}</span>
            </div>
        `).join('');
        suggestionsPanel.style.display = 'block';
    } else {
        suggestionsPanel.style.display = 'none';
    }
}

window.selectSuggestion = (value) => {
    searchInput.value = value;
    if (searchWrapper) searchWrapper.classList.add('has-text');
    if (suggestionsPanel) suggestionsPanel.style.display = 'none';
    filterGallery();
    updateInterfaceState();
};

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
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getSkillStyle(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash * 137.5) % 360;
    return `background: hsla(${h}, 95%, 75%, 0.12); color: hsl(${h}, 95%, 75%); border: 1px solid hsla(${h}, 95%, 75%, 0.4); text-shadow: 0 0 8px hsla(${h}, 95%, 75%, 0.25);`;
}

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

function updateFilterCounts(currentSearchQuery = "") {
    const query = currentSearchQuery.toLowerCase().trim();
    filterBtns.forEach(btn => {
        const filter = btn.dataset.filter;
        const count = displayedCreatives.filter(person => {
            const matchesSearch = !query || 
                person.name.toLowerCase().includes(query) ||
                person.skills.some(s => s.toLowerCase().includes(query)) ||
                (person.location && person.location.toLowerCase().includes(query)) ||
                (person.experience && person.experience.toString().includes(query));
            const matchesCategory = filter === 'all' || 
                person.skills.some(s => s.toLowerCase() === filter.toLowerCase());
            return matchesSearch && matchesCategory;
        }).length;

        const label = btn.getAttribute('data-label') || btn.innerText.split(' (')[0];
        btn.setAttribute('data-label', label);
        btn.innerText = `${label} (${count})`;
    });
}

function renderCards(data) {
    currentFilteredData = data; 
    const query = searchInput.value;
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

    const cardsHTML = data.map((person, index) => {
        const isPro = isUserPro(person);
        const hasLongBio = isPro && person.longBio && person.longBio.trim() !== "";
        
        const highlightedName = highlightText(person.name, query);
        const highlightedBio = highlightText(person.bio, query);
        const highlightedLongBio = hasLongBio ? highlightText(person.longBio, query) : "";

        const badgesHTML = person.skills.map(skill => {
            const highlightedSkill = highlightText(skill, query);
            return `<button class="badge" style="${getSkillStyle(skill)}; cursor: pointer; border: none; font-family: inherit;" onclick="event.stopPropagation(); window.filterBySkill('${skill}')">${highlightedSkill}</button>`;
        }).join('');

        const verifiedBadge = isPro ? VERIFIED_STAR_SVG : '';
        const hireButton = isPro ? `<a href="mailto:${person.email}?subject=Inquiry: Collaboration" onclick="event.stopPropagation();" class="btn-hire">Work with Me</a>` : '';

        return `
            <div class="card ${isPro ? 'is-pro' : ''}" style="animation-delay: ${index * 0.04}s; cursor: pointer;" data-name="${person.name}">
                <div class="profile-img">
                    <img src="${person.image}" alt="${person.name}" loading="lazy" decoding="async">
                </div>
                <div class="badge-container">${badgesHTML}</div>
                <h3 style="display: flex; align-items: center; gap: 4px;">${highlightedName} ${verifiedBadge}</h3>
                <div class="bio-wrapper">
                    <p class="bio">
                        ${highlightedBio}
                        ${hasLongBio ? `<span class="more-text" id="more-${index}">${highlightedLongBio}</span>` : ''}
                    </p>
                    ${hasLongBio ? `<button class="read-more-btn" onclick="event.stopPropagation(); window.toggleBio(${index}, this)">Read More</button>` : ''}
                </div>
                ${hireButton}
                <div class="social-links">
                    ${person.email ? `<a href="mailto:${person.email}" onclick="event.stopPropagation();" class="social-link-item">email</a>` : ''}
                    ${Object.entries(person.links || {}).slice(0, 2).map(([platform, url]) => `
                        <a href="${url}" target="_blank" onclick="event.stopPropagation();" class="social-link-item">${platform}</a>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    window.requestAnimationFrame(() => {
        directory.innerHTML = cardsHTML;
    });
}

function openQuickView(person) {
    if (!drawer || !drawerBody) return;

    const isPro = isUserPro(person);
    isPro ? drawerContent.classList.add('is-pro') : drawerContent.classList.remove('is-pro');

    const featuredLinks = isPro ? (person.featuredWork || []) : (person.featuredWork ? person.featuredWork.slice(0, 5) : []);

    const linksHTML = featuredLinks.length > 0 ? `
        <div class="drawer-section">
            <p class="drawer-section-title">Featured Projects</p>
            <div class="work-link-list">
                ${featuredLinks.map(link => `
                    <a href="${link.url}" target="_blank" class="work-link-item">
                        <span>${link.title}</span>
                        <span class="link-icon">↗</span>
                    </a>
                `).join('')}
            </div>
        </div>
    ` : '';

    drawerBody.innerHTML = `
        <div class="drawer-header">
            <img src="${person.image}" alt="${person.name}" class="drawer-img">
            <h2 class="drawer-name" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                ${person.name} 
                ${isPro ? VERIFIED_STAR_SVG.replace('width="18" height="18"', 'width="24" height="24"') : ''}
            </h2>
            <div class="drawer-stats" style="display: flex; justify-content: center; gap: 24px; margin: 1rem 0; padding: 1rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
                <div class="stat-item" style="text-align: center;"><span style="display: block; font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Location</span><b>${person.location || 'Remote'}</b></div>
                <div class="stat-item" style="text-align: center;"><span style="display: block; font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Experience</span><b>${person.experience || '1'}+ Years</b></div>
            </div>
            <div class="badge-container" style="justify-content: center; mask-image: none; -webkit-mask-image: none; overflow: visible; flex-wrap: wrap; margin-top: 1rem;">
                ${person.skills.map(s => `<button class="badge" style="${getSkillStyle(s)}; cursor: pointer; border: none; font-family: inherit;" onclick="window.filterBySkill('${s}')">${s}</button>`).join('')}
            </div>
        </div>
        <div class="drawer-section" style="margin-bottom: 2rem;">
            <p class="drawer-section-title">About</p>
            <p class="drawer-longbio">${person.longBio || person.bio}</p>
        </div>
        ${linksHTML}
        <div class="drawer-section" style="margin-top: 2rem;">
            <p class="drawer-section-title">Connect</p>
            <div class="social-links" style="border: none; padding: 0;">
                ${Object.entries(person.links || {}).map(([platform, url]) => `
                    <a href="${url}" target="_blank" class="social-link-item">${platform}</a>
                `).join('')}
                ${person.email ? `<a href="mailto:${person.email}" class="social-link-item">Email</a>` : ''}
            </div>
        </div>

        <div class="share-section">
            <div class="share-content">
                <p class="share-text">Spread the word about ${person.name.split(' ')[0]}'s work</p>
                <button class="btn-copy-link" onclick="window.copyProfileLink('${person.name}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>Copy Link</span>
                </button>
            </div>
        </div>

        <a href="mailto:${person.email}" class="btn-hire" style="margin-top: 1rem; padding: 16px; font-size: 0.9rem;">
            Hire ${person.name.split(' ')[0]}
        </a>
    `;

    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

window.copyProfileLink = (name) => {
    const profileUrl = `${window.location.origin}${window.location.pathname}?name=${slugify(name)}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
        const btn = document.querySelector('.btn-copy-link');
        const span = btn.querySelector('span');
        btn.classList.add('copied');
        span.innerText = "Copied!";
        setTimeout(() => {
            btn.classList.remove('copied');
            span.innerText = "Copy Link";
        }, 2000);
    });
};

const closeDrawer = () => {
    drawer.classList.remove('is-open');
    document.body.style.overflow = 'auto';
    const url = new URL(window.location);
    url.searchParams.delete('name');
    window.history.replaceState({}, '', url);
};

let touchStartY = 0;
if (drawerContent) {
    drawerContent.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    drawerContent.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchEndY - touchStartY > 100 && drawerContent.scrollTop <= 0) closeDrawer();
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
    const isFilterAll = activeFilter === 'all';

    const filtered = displayedCreatives.filter(person => {
        const matchesSearch = !query || 
            person.name.toLowerCase().includes(query) ||
            person.bio.toLowerCase().includes(query) ||
            (person.longBio && person.longBio.toLowerCase().includes(query)) ||
            person.skills.some(s => s.toLowerCase().includes(query)) ||
            (person.location && person.location.toLowerCase().includes(query)) ||
            (person.experience && person.experience.toString().includes(query));

        if (!matchesSearch) return false;
        return isFilterAll || person.skills.some(skill => skill.toLowerCase() === activeFilter.toLowerCase());
    });

    renderCards(filtered);
    updateFilterCounts(query);
}

window.clearSearch = () => {
    searchInput.value = '';
    if (searchWrapper) searchWrapper.classList.remove('has-text'); 
    filterBtns.forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('[data-filter="all"]');
    if (allBtn) allBtn.classList.add('active');
    if (suggestionsPanel) suggestionsPanel.style.display = 'none';

    const url = new URL(window.location);
    url.searchParams.delete('filter');
    url.searchParams.delete('name');
    window.history.replaceState({}, '', url);

    filterGallery();
    updateInterfaceState();
    searchInput.focus();
};

const debouncedFilter = debounce(() => {
    filterGallery();
}, 150);

searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (searchWrapper) {
        val.length > 0 ? searchWrapper.classList.add('has-text') : searchWrapper.classList.remove('has-text');
    }
    showSuggestions(val);
    debouncedFilter();
    updateInterfaceState();
});

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', window.clearSearch);
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', window.clearSearch);
}

document.addEventListener('click', (e) => {
    if (suggestionsPanel && !e.target.closest('.search-wrapper')) {
        suggestionsPanel.style.display = 'none';
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.classList.contains('active')) return;

        const filter = btn.dataset.filter;
        const url = new URL(window.location);
        
        // Update URL and History
        if (filter === 'all') {
            url.searchParams.delete('filter');
        } else {
            url.searchParams.set('filter', slugify(filter));
        }
        window.history.replaceState({}, '', url);

        // Update Active Button State
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Refresh Gallery and UI Components only
        filterGallery(); 
        updateInterfaceState();

        // Note: renderSpotlightPill is NOT called here to keep the daily person locked.
    });
});

shareCategoryBtn?.addEventListener('click', () => {
    const activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return;
    const filterValue = activeBtn.dataset.filter;
    const shareUrl = `${window.location.origin}${window.location.pathname}?filter=${slugify(filterValue)}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        const span = shareCategoryBtn.querySelector('span');
        const originalText = span.innerText;
        shareCategoryBtn.classList.add('copied');
        span.innerText = "Link Copied!";
        setTimeout(() => {
            shareCategoryBtn.classList.remove('copied');
            updateInterfaceState();
        }, 2000);
    });
});

directory.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || e.target.closest('.btn-hire') || e.target.closest('.social-links') || e.target.closest('.read-more-btn') || e.target.closest('.badge')) {
        return;
    }
    const personName = card.dataset.name;
    const person = displayedCreatives.find(p => p.name === personName);
    if (person) openQuickView(person);
});

if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
if (drawerOverlay) drawerOverlay.onclick = closeDrawer;

function initFooterObserver() {
    const fab = document.querySelector('.fab');
    const footer = document.querySelector('footer');
    if (!fab || !footer) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.isIntersecting ? fab.classList.add('fab-hidden') : fab.classList.remove('fab-hidden');
        });
    }, { threshold: 0.1 });
    observer.observe(footer);
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function initializeGallery() {
    // 1. IMMEDIATE: Show the UI shell so the page doesn't look empty
    showSkeletons();
    renderSpotlightPill(); 

    // 2. DEFERRED: Handle heavy data processing and animations after a short delay
    setTimeout(() => {
        // Prepare the master list (Pros first, then Regulars)
        const activePros = shuffle([...creatives.filter(c => isUserPro(c))]);
        const regulars = shuffle([...creatives.filter(c => !isUserPro(c))]);
        displayedCreatives = [...activePros, ...regulars];

        // Calculate stats for the counter animations
        const allSkills = displayedCreatives.flatMap(p => p.skills);
        const uniqueSpecialties = [...new Set(allSkills.map(s => s.toLowerCase()))].length;
        
        const totalCountEl = document.getElementById('totalCount');
        const specialtyCountEl = document.getElementById('specialtyCount');

        // Trigger numerical animations
        if (totalCountEl) animateValue(totalCountEl, 0, displayedCreatives.length, 1200);
        if (specialtyCountEl) {
            setTimeout(() => animateValue(specialtyCountEl, 0, uniqueSpecialties, 1000), 200);
        }

        // Final UI assembly
        renderCards(displayedCreatives);
        checkDeepLink();
        updateFilterCounts();
        updateInterfaceState();
        
        // Initialize Observers
        initStickyObserver();
        initFooterObserver();
        initScrollReveal(); 
    }, 800);
}

function checkDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const personSlug = urlParams.get('name');
    const filterSlug = urlParams.get('filter');
    
    if (filterSlug) {
        const targetBtn = Array.from(filterBtns).find(btn => 
            slugify(btn.dataset.filter) === filterSlug.toLowerCase()
        );
        if (targetBtn) targetBtn.click();
    }

    if (personSlug) {
        const person = displayedCreatives.find(p => slugify(p.name) === personSlug.toLowerCase());
        if (person) {
            setTimeout(() => openQuickView(person), 150);
        }
    }
}

function initScrollReveal() {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);
    document.querySelectorAll('.card').forEach(card => observer.observe(card));
}

function initStickyObserver() {
    const filterContainer = document.querySelector('.filter-container');
    const observer = new IntersectionObserver(([e]) => e.target.classList.toggle('is-pinned', e.intersectionRatio < 1), {
        threshold: [1],
        rootMargin: '0px'
    });
    if (filterContainer) observer.observe(filterContainer);
}

document.addEventListener('DOMContentLoaded', initializeGallery);

const modal = document.getElementById("pricingModal");
const openModalBtn = document.getElementById("openPricing");
const ctaOpenModalBtn = document.getElementById("ctaOpenPricing");
const closeModalBtn = document.querySelector(".close-modal");

const openModal = () => { if (modal) modal.style.display = "flex"; };
const closeModal = () => { if (modal) modal.style.display = "none"; };

if (openModalBtn) openModalBtn.onclick = openModal;
if (ctaOpenModalBtn) ctaOpenModalBtn.onclick = openModal;
if (closeModalBtn) closeModalBtn.onclick = closeModal;

const aboutModal = document.getElementById("aboutModal");
const openAboutBtn = document.getElementById("openAbout");
const closeAboutBtn = document.querySelector(".close-about");

const openAbout = () => { if (aboutModal) aboutModal.style.display = "flex"; };
const closeAbout = () => { if (aboutModal) aboutModal.style.display = "none"; };

if (openAboutBtn) openAboutBtn.onclick = openAbout;
if (closeAboutBtn) closeAboutBtn.onclick = closeAbout;

window.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
    if (event.target === aboutModal) closeAbout();
});

/**
 * FEATURE: Balanced Merit-Based Global Spotlight
 * Features one member per day site-wide based on Experience, Pro status, and Profile Quality.
 * Locked to a 24-hour cycle regardless of filtering.
 */
function renderSpotlightPill() {
    const container = document.getElementById('spotlightContainer');
    if (!container || !creatives.length) return;

    // 1. Calculate Merit Scores (Global weighting, no filter bias)
    const scoredPool = creatives.map((person, index) => {
        let score = 10; // Base tickets for everyone

        // MERIT: Experience is high priority (e.g., 10 years = 40 points)
        if (person.experience) {
            score += Math.floor(person.experience * 4); 
        }

        // STATUS: Pro members get a nudge
        if (isUserPro(person)) {
            score += 20; 
        }

        // QUALITY: Reward profiles with more projects
        if (person.featuredWork && person.featuredWork.length > 0) {
            score += (person.featuredWork.length * 2);
        }

        return { index, score, person };
    });

    const totalScore = scoredPool.reduce((sum, item) => sum + item.score, 0);

    // 2. Global 24-Hour Seed (Strictly date-based)
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // 3. Deterministic Selection (LCG Algorithm)
    const lcg = (seed) => (seed * 16807) % 2147483647;
    let selectionValue = lcg(dateSeed) % totalScore;
    
    let winner = scoredPool[0].person;
    for (const item of scoredPool) {
        if (selectionValue < item.score) {
            winner = item.person;
            break;
        }
        selectionValue -= item.score;
    }

    // 4. Label Logic (Based on the winner's specific highlights)
    let label = "Spotlight";
    let isDiscovery = false;

    if (winner.experience >= 10) {
        label = "Industry Expert";
        isDiscovery = true; 
    } else if (isUserPro(winner)) {
        label = "Verified Creator";
    }

    // 5. Render
    container.innerHTML = `
        <div class="spotlight-pill" onclick="window.openQuickViewByName('${winner.name}')">
            <img src="${winner.image}" alt="${winner.name}" loading="lazy">
            <span class="spotlight-label ${isDiscovery ? 'is-discovery' : ''}">${label}</span>
            <span class="spotlight-name">${winner.name}</span>
            <div class="spotlight-meta">
                <span class="spotlight-role">${winner.skills[0]}</span>
                <span class="spotlight-exp">${winner.experience || 1}y+ Exp</span>
                <span class="spotlight-arrow">→</span>
            </div>
        </div>
    `;
}

/**
 * HELPER: Open QuickView by Name
 */
window.openQuickViewByName = (name) => {
    const person = creatives.find(p => p.name === name);
    if (person) {
        openQuickView(person);
    }
};
