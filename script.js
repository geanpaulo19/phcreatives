import { creatives } from './creatives.js';

const directory = document.getElementById('directory');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');
const counter = document.getElementById('counter');

let displayedCreatives = [];

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

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

/**
 * Generates a unique, vibrant color per skill string.
 */
function getSkillStyle(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash * 137.5) % 360; 
    const color = `hsl(${h}, 95%, 75%)`;
    const background = `hsla(${h}, 95%, 75%, 0.12)`;
    const border = `hsla(${h}, 95%, 75%, 0.4)`;
    const shadow = `hsla(${h}, 95%, 75%, 0.25)`;
    
    return `background: ${background}; color: ${color}; border: 1px solid ${border}; text-shadow: 0 0 8px ${shadow};`;
}

/**
 * Renders the creative cards into the grid
 */
function renderCards(data) {
    counter.innerText = `Showcasing ${data.length} curated Filipino creatives`;

    if (data.length === 0) {
        directory.innerHTML = `
            <div class="no-results">
                <p>No creatives found matching that search.</p>
                <button onclick="window.clearSearch()" class="filter-btn" style="margin-top: 20px; border-color: var(--accent); color: var(--accent);">Clear Search</button>
            </div>`;
        return;
    }

    directory.innerHTML = data.map((person, index) => {
        const isPro = isUserPro(person);
        const hasLongBio = isPro && person.longBio && person.longBio.trim() !== "";

        const badgesHTML = person.skills.map(skill => 
            `<span class="badge" style="${getSkillStyle(skill)}">${skill}</span>`
        ).join('');

        const linksHTML = Object.entries(person.links)
            .filter(([platform, url]) => url && url.trim() !== "")
            .map(([platform, url]) => 
                `<a href="${url}" target="_blank" class="social-link-item">${platform}</a>`
            ).join('');

        const emailLinkHTML = person.email ? 
            `<a href="mailto:${person.email}" class="social-link-item">email</a>` : '';

        const verifiedBadge = isPro ? `<span class="verified-icon" title="Featured Creative">✦</span>` : '';
        
        const hireButton = isPro ? 
            `<a href="mailto:${person.email}?subject=Inquiry: Collaboration with ${person.name}" class="btn-hire">Work with Me</a>` : '';

        return `
            <div class="card ${isPro ? 'is-pro' : ''}" style="animation-delay: ${index * 0.05}s">
                <div class="profile-img">
                    <img src="${person.image}" alt="${person.name}" loading="lazy">
                </div>
                <div class="badge-container">
                    ${badgesHTML}
                </div>
                <h3>${person.name} ${verifiedBadge}</h3>
                
                <div class="bio-wrapper">
                    <p class="bio">
                        ${person.bio}
                        ${hasLongBio ? `<span class="more-text" id="more-${index}">${person.longBio}</span>` : ''}
                    </p>
                    ${hasLongBio ? `<button class="read-more-btn" onclick="toggleBio(${index}, this)">Read More</button>` : ''}
                </div>

                ${hireButton}
                <div class="social-links">
                    ${emailLinkHTML}
                    ${linksHTML}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * FEATURE: Toggle Expanded Bio
 */
window.toggleBio = (index, btn) => {
    const moreText = document.getElementById(`more-${index}`);
    if (moreText) {
        const isExpanded = moreText.classList.toggle('visible');
        btn.innerText = isExpanded ? "Read Less" : "Read More";
    }
};

/**
 * Filters the data
 */
function filterGallery() {
    const query = searchInput.value.toLowerCase().trim();
    const activeBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeBtn ? activeBtn.dataset.filter : 'all';

    const filtered = displayedCreatives.filter(person => {
        const matchesSearch = 
            person.name.toLowerCase().includes(query) || 
            person.bio.toLowerCase().includes(query) ||
            (person.longBio && person.longBio.toLowerCase().includes(query)) ||
            person.skills.some(s => s.toLowerCase().includes(query));
                              
        let matchesFilter = true;
        if (activeFilter !== 'all') {
            matchesFilter = person.skills.some(skill => 
                skill.toLowerCase() === activeFilter.toLowerCase()
            );
        }
        
        return matchesSearch && matchesFilter;
    });

    renderCards(filtered);
}

// --- HELPER: Clear Search ---
window.clearSearch = () => {
    searchInput.value = '';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    filterGallery();
};

// --- EVENT LISTENERS ---

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterGallery, 150);
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const scrollTarget = document.querySelector('.filter-container').offsetTop - 20;

        window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });

        filterGallery();
    });
});

/**
 * Initial Initialization
 */
function initializeGallery() {
    const activePros = shuffle([...creatives.filter(c => isUserPro(c))]);
    const regulars = shuffle([...creatives.filter(c => !isUserPro(c))]);

    displayedCreatives = [...activePros, ...regulars]; 
    renderCards(displayedCreatives);
    initStickyObserver();
}

/**
 * FEATURE: Sticky Observer
 * Adds .is-pinned class when filter bar hits the top
 */
function initStickyObserver() {
    const filterContainer = document.querySelector('.filter-container');
    
    // Using a threshold of 1 and checking intersectionRatio ensures 
    // it triggers as soon as the element is "stuck"
    const observer = new IntersectionObserver(
        ([e]) => e.target.classList.toggle('is-pinned', e.intersectionRatio < 1),
        { 
            threshold: [1],
            rootMargin: '-1px 0px 0px 0px' // Slightly offset to trigger the state immediately
        }
    );

    if (filterContainer) {
        observer.observe(filterContainer);
    }
}

document.addEventListener('DOMContentLoaded', initializeGallery);

// --- MODAL LOGIC ---
const modal = document.getElementById("pricingModal");
const openModalBtn = document.getElementById("openPricing");
const ctaOpenModalBtn = document.getElementById("ctaOpenPricing");
const closeModalBtn = document.querySelector(".close-modal");

const openModal = () => { if (modal) modal.style.display = "flex"; };
const closeModal = () => { if (modal) modal.style.display = "none"; };

if (openModalBtn) openModalBtn.onclick = openModal;
if (ctaOpenModalBtn) ctaOpenModalBtn.onclick = openModal;
if (closeModalBtn) closeModalBtn.onclick = closeModal;

window.onclick = (event) => {
    if (event.target === modal) closeModal();
};
