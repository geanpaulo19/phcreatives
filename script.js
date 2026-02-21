import { creatives } from './creatives.js';

const directory = document.getElementById('directory');
const searchInput = document.getElementById('search');
const searchWrapper = document.querySelector('.search-wrapper');
const clearSearchBtn = document.getElementById('clearSearchBtn'); // Selection for the text-based button
const filterBtns = document.querySelectorAll('.filter-btn');
const counter = document.getElementById('counter');

// Drawer Elements
const drawer = document.getElementById('quickView');
const drawerBody = document.getElementById('drawerBody');
const drawerContent = document.querySelector('.drawer-content');
const closeDrawerBtn = document.querySelector('.close-drawer');
const drawerOverlay = document.querySelector('.drawer-overlay');

// Suggestion Panel
const suggestionsPanel = document.getElementById('searchSuggestions');

let displayedCreatives = []; // Master list: Pro first, then Regular
let currentFilteredData = []; // Currently visible list

// Reusable SVG Star Component
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
        filterGallery();
        if (suggestionsPanel) suggestionsPanel.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

/**
 * FEATURE: Dynamic Search Suggestions (Including Experience)
 */
function showSuggestions(query) {
    if (!suggestionsPanel) return;
    if (!query || query.length < 1) {
        suggestionsPanel.style.display = 'none';
        return;
    }

    const matches = [];
    const lowerQuery = query.toLowerCase();

    // 1. Matches for Names
    creatives.forEach(p => {
        if (p.name.toLowerCase().includes(lowerQuery)) {
            matches.push({ label: p.name, type: 'Creative', value: p.name });
        }
    });

    // 2. Matches for Unique Skills
    const uniqueSkills = [...new Set(creatives.flatMap(p => p.skills))];
    uniqueSkills.forEach(skill => {
        if (skill.toLowerCase().includes(lowerQuery)) {
            matches.push({ label: skill, type: 'Skill', value: skill });
        }
    });

    // 3. Matches for Experience
    const experiences = [...new Set(creatives.map(p => p.experience).filter(v => v != null))];
    experiences.forEach(exp => {
        const expStr = exp.toString();
        if (expStr.includes(lowerQuery) || ("years".includes(lowerQuery) && lowerQuery.length > 2)) {
            matches.push({ label: `${exp}+ Years Exp`, type: 'Experience', value: expStr });
        }
    });

    // 4. Matches for Unique Locations
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
    }).slice(0, 6);

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
};

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
        const badgesHTML = person.skills.map(skill =>
            `<button class="badge" style="${getSkillStyle(skill)}; cursor: pointer; border: none; font-family: inherit;" onclick="event.stopPropagation(); window.filterBySkill('${skill}')">${skill}</button>`
        ).join('');
        const verifiedBadge = isPro ? VERIFIED_STAR_SVG : '';
        const hireButton = isPro ? `<a href="mailto:${person.email}?subject=Inquiry: Collaboration" onclick="event.stopPropagation();" class="btn-hire">Work with Me</a>` : '';

        return `
            <div class="card ${isPro ? 'is-pro' : ''}" style="animation-delay: ${index * 0.05}s; cursor: pointer;" data-name="${person.name}">
                <div class="profile-img"><img src="${person.image}" alt="${person.name}" loading="lazy"></div>
                <div class="badge-container">${badgesHTML}</div>
                <h3 style="display: flex; align-items: center; gap: 4px;">${person.name} ${verifiedBadge}</h3>
                <div class="bio-wrapper">
                    <p class="bio">
                        ${person.bio}
                        ${hasLongBio ? `<span class="more-text" id="more-${index}">${person.longBio}</span>` : ''}
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
        <a href="mailto:${person.email}" class="btn-hire" style="margin-top: 3rem; padding: 16px; font-size: 0.9rem;">
            Hire ${person.name.split(' ')[0]}
        </a>
    `;

    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

const closeDrawer = () => {
    drawer.classList.remove('is-open');
    document.body.style.overflow = 'auto';
};

// Touch handling for drawer
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

    const filtered = displayedCreatives.filter(person => {
        const matchesSearch =
            person.name.toLowerCase().includes(query) ||
            person.bio.toLowerCase().includes(query) ||
            (person.longBio && person.longBio.toLowerCase().includes(query)) ||
            person.skills.some(s => s.toLowerCase().includes(query)) ||
            (person.location && person.location.toLowerCase().includes(query)) ||
            (person.experience && person.experience.toString().includes(query));

        let matchesFilter = activeFilter === 'all' || person.skills.some(skill => skill.toLowerCase() === activeFilter.toLowerCase());
        return matchesSearch && matchesFilter;
    });

    renderCards(filtered);
    updateFilterCounts(query);
}

window.clearSearch = () => {
    searchInput.value = '';
    if (searchWrapper) searchWrapper.classList.remove('has-text'); // Clear UI visibility state
    filterBtns.forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('[data-filter="all"]');
    if (allBtn) allBtn.classList.add('active');
    if (suggestionsPanel) suggestionsPanel.style.display = 'none';
    filterGallery();
    searchInput.focus();
};

let searchTimeout;
searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    
    // Toggle the "has-text" class on the wrapper to show/hide "Clear" button
    if (searchWrapper) {
        val.length > 0 ? searchWrapper.classList.add('has-text') : searchWrapper.classList.remove('has-text');
    }

    showSuggestions(val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterGallery, 150);
});

// Listener for the internal "Clear" text button
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', window.clearSearch);
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
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterGallery();
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
    showSkeletons();
    setTimeout(() => {
        const activePros = shuffle([...creatives.filter(c => isUserPro(c))]);
        const regulars = shuffle([...creatives.filter(c => !isUserPro(c))]);
        displayedCreatives = [...activePros, ...regulars];

        const allSkills = displayedCreatives.flatMap(p => p.skills);
        const uniqueSpecialties = [...new Set(allSkills.map(s => s.toLowerCase()))].length;
        const totalCountEl = document.getElementById('totalCount');
        const specialtyCountEl = document.getElementById('specialtyCount');

        if (totalCountEl) animateValue(totalCountEl, 0, displayedCreatives.length, 1200);
        if (specialtyCountEl) {
            setTimeout(() => animateValue(specialtyCountEl, 0, uniqueSpecialties, 1000), 200);
        }

        renderCards(displayedCreatives);
        updateFilterCounts();
        initStickyObserver();
        initFooterObserver();
    }, 800);
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
