/******************/
/* Module Imports */
/******************/
import { parseHTMLToElement } from "/js/site/shared/SharedAppUtilities.js"

/**
* Build a responsive navbar component for the given page.
* @param {string} activePage The name of the current page ("log", "stats", or "settings").
* @returns {HTMLElement} The constructed navbar element with active state applied.
* @throws {TypeError} If activePage is not a non-empty string.
* @throws {Error} If activePage is not one of the valid page names.
* This function generates a navbar with two layouts:
* - A top navbar for extra-large screens (desktop).
* - A bottom fixed navbar for smaller screens (mobile).
* The active page is highlighted dynamically based on the inputted activePage.
*/
function createNavbar(activePage) {
    // Validate that currentPageName is a non-empty string
    if (typeof activePage !== "string" || !activePage) {
        throw new TypeError("currentPageName must be a non-empty string.");
    }

    // Normalize currentPageName to lowercase for consistent comparison
    activePage = activePage.toLowerCase();

    // Validate that currentPageName is a valid page name
    if (!["log", "stats", "settings"].includes(activePage)) {
        throw new Error("The inputted currentPageName is not a valid page name.");
    }

    // Construct the navbar HTML string with dynamic classes for active state
    const navbarHTML = `
        <div class="mb-5" id="navbar">
            <nav class="navbar navbar-expand-sm bg-dark d-none d-xl-flex" data-bs-theme="dark">
                <div class="container-fluid d-flex justify-content-between mx-lg-5">
                    <a class="navbar-brand fw-bold" href="#">
                        <i class="fa-solid fa-square-pen"></i>
                        MyJot
                    </a>
                    <div>
                        <ul class="navbar-nav" >
                            <li class="nav-item px-5">         
                                <a class="nav-link d-inline ${activePage === 'log' ? 'active' : ''}" aria-current="page" href="/pages/log.html"><i class="fas fa-book fa-lg me-2"></i>Log</a>
                            </li>
                            <li class="nav-item px-5">               
                                <a class="nav-link d-inline ${activePage === 'stats' ? 'active' : ''}" href="/pages/stats.html"><i class="fa-solid fa-chart-column fa-lg me-2"></i>Stats</a>
                            </li>
                            <li class="nav-item px-5">                  
                                <a class="nav-link d-inline ${activePage === 'settings' ? 'active' : ''}" href="/pages/settings.html"><i class="fas fa-user-cog fa-lg me-2"></i>Settings</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            <nav class="container-fluid bg-dark fixed-bottom d-flex d-xl-none" data-bs-theme="dark">
                <div class="container-fluid text-center d-flex justify-content-between py-2">
                    <div class="col ${activePage === 'log' ? 'text-white' : 'text-secondary'}">
                        <a class="nav-link" aria-current="page" href="/pages/log.html">
                            <i class="fas fa-book fa-lg mb-2"></i>
                            <p>Log</p>
                        </a>
                    </div>
                    <div class="col ${activePage === 'stats' ? 'text-white' : 'text-secondary'}">
                        <a class="nav-link" href="/pages/stats.html">
                            <i class="fa-solid fa-chart-column fa-lg mb-2"></i>
                            <p>Stats</p>
                        </a>
                    </div>
                    <div class="col ${activePage === 'settings' ? 'text-white' : 'text-secondary'}">                  
                        <a class="nav-link" href="/pages/settings.html">
                            <i class="fas fa-user-cog fa-lg mb-2"></i>
                            <p>Settings</p>
                        </a>
                    </div>
                </div>
            </nav>
        </div>  
    `;

    // Convert the HTML string into a DOM element and return it
    return parseHTMLToElement(navbarHTML, "#navbar");
}

export { createNavbar }