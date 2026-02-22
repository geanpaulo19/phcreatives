# 🇵🇭 PHCREATIVES

**PHCREATIVES** is a premium, dark-themed discovery platform designed to showcase top-tier Filipino creative talent. The interface balances high-end aesthetics with functional performance, featuring a mobile-first responsive grid and smooth, hardware-accelerated micro-interactions.

![License](https://img.shields.io/badge/license-MIT-6366f1)
![Community](https://img.shields.io/badge/community-Philippines-red)
![Status](https://img.shields.io/badge/status-active-ec4899)

---

## ✨ Key Features

* **Glassmorphism UI:** Deep dark backgrounds with radial glow accents (`#6366f1`) and backdrop-filter glass effects for a premium feel.
* **Sticky Search & Filter System:** A smart, non-intrusive navigation bar that pins to the top on scroll, featuring real-time category filtering and an instant search bar.
* **QuickView Drawer:** A smooth-sliding side drawer for deep-diving into talent profiles without losing your place in the grid, complete with mobile-native swipe-to-dismiss support.
* **Verified Talent System:** Automated "Pro" status detection with unique visual signatures, including neon glowing borders, gold verified stars, and expanded "Read More" bios.
* **Deep-Linking Engine:** URL-based filtering and profile sharing. Users can share specific categories or individual profiles via automatically generated slugs.
* **Performance Optimized:** Skeleton loading states, debounced search logic, and `requestAnimationFrame` rendering for butter-smooth scrolling.

---

## 🛠️ Tech Stack

* **HTML5** – Clean, semantic structure optimized for SEO and accessibility.
* **CSS3** – Modern layout techniques (Grid/Flexbox), custom variables, and cubic-bezier animation systems.
* **JavaScript (ES6)** – Modular logic featuring Intersection Observers for sticky states and dynamic suggestion engines.
* **Typography** – *Outfit* for bold, modern headings and *Inter* for high-legibility body text.

---

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/phcreatives.git](https://github.com/yourusername/phcreatives.git)
    ```
2.  **Launch**
    Simply open `index.html` in any modern browser. No build steps required.

3.  **Customization**
    Tweak the core brand identity and spacing via the `:root` variables in `style.css`:
    ```css
    :root {
        --accent: #6366f1; /* Signature phcreatives purple */
        --bg-dark: #0a0c10;
        --grid-gap: 2rem;
    }
    ```

---

## 📱 Responsive Preview

| Desktop | Tablet | Mobile |
| :--- | :--- | :--- |
| **4-Column Grid** | **2-Column Grid** | **1-Column List** |
| Full Search Bar | Compact Search | Full-Width Search |
| Hover Reveal Effects | Tap-to-View | Swipe-to-Dismiss Drawer |
| Fixed Share FAB | Hidden Footer FAB | Dynamic "Share Category" FAB |

---

## 📂 Project Structure

* `index.html` – The core structure and modal/drawer templates.
* `style.css` – The entire design system, including the pinned-header logic and Pro-tier animations.
* `script.js` – The application logic (Filtering, URL state, Search suggestions).
* `creatives.js` – The centralized data module for easy talent management.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Designed with 💜 for the Filipino Creative Community.
