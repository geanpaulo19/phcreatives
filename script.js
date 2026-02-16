import { creatives } from './creatives.js';

const directory = document.getElementById('directory');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');
const counter = document.getElementById('counter');

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
    
    return `
        background: ${background}; 
        color: ${color}; 
        border: 1px solid ${border}; 
        text-shadow: 0 0 8px ${shadow};
    `;
}

/**
 * Renders the creative cards into the grid
 */
function renderCards(data) {
    counter.innerText = `Showcasing ${data.length} curated Filipino creatives`;

    if (data.length === 0) {
        directory.innerHTML = `<div class="no-results">No creatives found matching that search.</div>`;
        return;
    }

    directory.innerHTML = data.map((person, index) => {
        const badgesHTML = person.skills.map(skill => 
            `<span class="badge" style="${getSkillStyle(skill)}">${skill}</span>`
        ).join('');

        const linksHTML = Object.entries(person.links)
            .filter(([platform, url]) => url && url.trim() !== "")
            .map(([platform, url]) => 
                `<a href="${url}" target="_blank">${platform}</a>`
            ).join('');

        return `
            <div class="card" style="animation-delay: ${index * 0.05}s">
                <div class="profile-img">
                    <img src="${person.image}" alt="${person.name}" loading="lazy">
                </div>
                <div class="badge-container">
                    ${badgesHTML}
                </div>
                <h3>${person.name}</h3>
                <p class="bio">${person.bio}</p>
                <div class="social-links">
                    ${linksHTML}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filters the data (Optimized for accuracy)
 */
function filterGallery() {
    const query = searchInput.value.toLowerCase().trim();
    const activeBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeBtn ? activeBtn.dataset.filter : 'all';

    const filtered = creatives.filter(person => {
        // 1. Text Search Logic: Search across Name, Bio, AND the Skills array
        const matchesSearch = 
            person.name.toLowerCase().includes(query) || 
            person.bio.toLowerCase().includes(query) ||
            person.skills.some(s => s.toLowerCase().includes(query));
                              
        // 2. Category Logic: Check against the buttons
        let matchesFilter = true;
        if (activeFilter !== 'all') {
            matchesFilter = person.skills.some(skill => 
                skill.toLowerCase() === activeFilter.toLowerCase()
            );
        }
        
        // Accurate result: Item must satisfy the category AND the search text
        return matchesSearch && matchesFilter;
    });

    renderCards(filtered);
}

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
        filterGallery();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    renderCards(creatives);
});