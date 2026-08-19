document.addEventListener("DOMContentLoaded", () => {
    // --- Smooth Scrolling for Links ---
    document.querySelectorAll('a[href^="#"], .nav-link').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const targetId =
                this.getAttribute("href") || this.getAttribute("data-target");
            if (targetId && targetId !== "#") {
                e.preventDefault();
                closeMenu();
                const targetEl = document.querySelector(targetId);
                if (targetEl) scrollToAnchor(targetEl);
            }
        });
    });

    // --- Theme Switcher ---
    const themeToggle = document.getElementById("theme-toggle");
    const themeText = document.getElementById("theme-text");
    const iconLight = document.querySelector(".theme-icon-light");
    const iconDark = document.querySelector(".theme-icon-dark");

    function updateThemeButton(theme) {
        if (theme === "dark") {
            themeText.textContent = "hurt my eyes";
            iconLight.style.display = "block";
            iconDark.style.display = "none";
        } else {
            themeText.textContent = "my eyes hurt";
            iconLight.style.display = "none";
            iconDark.style.display = "block";
        }
    }
    updateThemeButton(
        document.documentElement.getAttribute("data-theme") || "light",
    );

    themeToggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
        updateThemeButton(next);
    });

    // --- Custom SVG Wink Easter Egg ---
    const smileyButton = document.getElementById("smiley-button");
    const smileySvg = document.getElementById("smiley-svg");
    if (smileyButton && smileySvg) {
        const wink = () => {
            if (smileySvg.classList.contains("winking")) return;
            smileySvg.classList.add("winking");
            setTimeout(() => smileySvg.classList.remove("winking"), 700);
        };
        smileyButton.addEventListener("click", wink);
    }

    // --- Menu Dropdown Logic & Easter Egg ---
    const logoBtn = document.getElementById("logo-btn");
    const menuDropdown = document.getElementById("menu-dropdown");
    const backToTopItem = document.getElementById("back-to-top-item");

    function updateBackToTop() {
        backToTopItem.hidden = window.scrollY < 40;
    }
    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });

    let openCount = parseInt(localStorage.getItem("menu_opens") || "0", 10);
    if (!localStorage.getItem("menu_target")) {
        localStorage.setItem(
            "menu_target",
            (Math.floor(Math.random() * 3) + 5).toString(),
        );
    }

    function openMenu() {
        openCount++;
        localStorage.setItem("menu_opens", openCount.toString());
        const targetCount = parseInt(localStorage.getItem("menu_target"), 10);

        const list = document.getElementById("menu-list-normal");
        const egg = document.getElementById("menu-list-egg");

        if (openCount === targetCount) {
            list.style.display = "none";
            egg.hidden = false;
            localStorage.setItem(
                "menu_target",
                (Math.floor(Math.random() * 3) + 5 + openCount).toString(),
            );
        } else {
            list.style.display = "block";
            egg.hidden = true;
        }

        menuDropdown.classList.add("open");
        menuDropdown.hidden = false;
        logoBtn.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
        menuDropdown.classList.remove("open");
        setTimeout(() => {
            if (!menuDropdown.classList.contains("open"))
                menuDropdown.hidden = true;
        }, 200);
        logoBtn.setAttribute("aria-expanded", "false");
    }

    logoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menuDropdown.classList.contains("open") ? closeMenu() : openMenu();
    });

    document.addEventListener("click", (e) => {
        if (
            menuDropdown.classList.contains("open") &&
            !menuDropdown.contains(e.target) &&
            !logoBtn.contains(e.target)
        ) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menuDropdown.classList.contains("open"))
            closeMenu();
    });

    // --- Gallery & Infinite Carousel Loading ---
    setupHeroVisualCompression();
    initGallery();
});

function scrollToAnchor(targetEl) {
    if (targetEl.id === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    const heading = targetEl.querySelector(".section-header h2");
    const target = heading || targetEl;
    const rect = target.getBoundingClientRect();
    const headerOffset = document.querySelector(".header")?.offsetHeight || 0;
    const topOffset = Math.max(16, headerOffset + 16);
    const targetTop = window.scrollY + rect.top - topOffset;

    window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
    });
}

function setupHeroVisualCompression() {
    const content = document.querySelector(".hero-content");
    if (
        !content ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
        return;

    let frameRequested = false;

    function updateHeroVisualCompression() {
        const compressionRange = window.innerHeight;
        const progress = Math.min(
            1,
            Math.max(0, window.scrollY / compressionRange),
        );
        const shift = window.innerHeight * 0.5 * progress;
        content.style.transform = `translateY(${-shift}px)`;
        frameRequested = false;
    }

    function requestHeroUpdate() {
        if (frameRequested) return;
        frameRequested = true;
        requestAnimationFrame(updateHeroVisualCompression);
    }

    updateHeroVisualCompression();
    window.addEventListener("scroll", requestHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHeroUpdate);
}

async function initGallery() {
    const carousel = document.querySelector(".carousel-container");
    const track = document.getElementById("carousel-track");
    const fallback = document.getElementById("gallery-fallback");
    let imageFiles = [];

    // 1. Load Images dynamically
    try {
        const response = await fetch("../assets/gallery/gallery.json");
        if (!response.ok) throw new Error("Network response was not ok");
        imageFiles = await response.json();
    } catch (e) {
        console.error(
            "Failed to load gallery.json, falling back to empty gallery.",
            e,
        );
        track.hidden = true;
        fallback.hidden = false;
        return;
    }

    track.innerHTML = "";

    // Create master group
    const group = document.createElement("div");
    group.className = "gallery-group";

    imageFiles.forEach((file) => {
        const img = document.createElement("img");
        img.className = "gallery-img";
        img.dataset.file = file;
        img.src = `../assets/gallery/${encodeURIComponent(file)}`;
        img.alt = file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
        img.loading = "lazy";
        img.tabIndex = 0;
        group.appendChild(img);
    });

    // Append the master group to track
    track.appendChild(group);

    // Clone twice for true mathematical infinite scrolling in both directions
    const clone1 = group.cloneNode(true);
    clone1.setAttribute("aria-hidden", "true");
    clone1.querySelectorAll("img").forEach((img) => (img.tabIndex = -1));
    track.appendChild(clone1);

    const clone2 = group.cloneNode(true);
    clone2.setAttribute("aria-hidden", "true");
    clone2.querySelectorAll("img").forEach((img) => (img.tabIndex = -1));
    track.appendChild(clone2);

    // 2. Setup Infinite Scroll & Auto-Scroll
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isAutoScrolling = !reduceMotion.matches;
    let inactivityTimer;
    let isDraggingClick = false;

    // Calculate dimensions exactly once images are loaded
    Promise.all(
        Array.from(track.querySelectorAll("img")).map((img) => {
            return new Promise((resolve) => {
                if (img.complete) resolve();
                else {
                    img.onload = resolve;
                    img.onerror = resolve;
                }
            });
        }),
    ).then(() => {
        // Position scroll securely in the middle track for endless dragging left/right
        carousel.scrollLeft = group.offsetWidth;
        requestAnimationFrame(carouselLoop);
    });

    function carouselLoop() {
        if (isAutoScrolling) {
            carousel.scrollLeft += 0.5;
        }

        const groupWidth = group.offsetWidth;
        if (groupWidth > 0) {
            // Re-center seamless bounds
            // Ensures you never reach the very beginning or the very end of the scroll container
            if (carousel.scrollLeft < groupWidth / 2) {
                carousel.scrollLeft += groupWidth;
            } else if (carousel.scrollLeft >= groupWidth * 1.5) {
                carousel.scrollLeft -= groupWidth;
            }
        }
        requestAnimationFrame(carouselLoop);
    }

    // 3. User interaction handlers
    function stopCarousel() {
        isAutoScrolling = false;
        clearTimeout(inactivityTimer);
    }

    function startCarousel() {
        clearTimeout(inactivityTimer);
        // Autoscroll slowly when inactive
        inactivityTimer = setTimeout(() => {
            if (!reduceMotion.matches) isAutoScrolling = true;
        }, 2000);
    }

    ["pointerdown", "touchstart", "wheel"].forEach((evt) => {
        carousel.addEventListener(evt, stopCarousel, { passive: true });
    });
    ["pointerup", "touchend", "mouseleave"].forEach((evt) => {
        carousel.addEventListener(evt, startCarousel, { passive: true });
    });
    carousel.addEventListener("mouseenter", stopCarousel);
    carousel.addEventListener("focusin", stopCarousel);
    carousel.addEventListener("focusout", (e) => {
        if (!carousel.contains(e.relatedTarget)) startCarousel();
    });

    // 4. Drag scrolling logic
    let isDown = false,
        startX,
        scrollLeft;
    carousel.addEventListener("mousedown", (e) => {
        isDown = true;
        isDraggingClick = false;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        carousel.style.cursor = "grabbing";
    });
    carousel.addEventListener("mouseleave", () => {
        isDown = false;
        carousel.style.cursor = "grab";
    });
    carousel.addEventListener("mouseup", () => {
        isDown = false;
        carousel.style.cursor = "grab";
    });
    carousel.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        isDraggingClick = true;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        carousel.scrollLeft = scrollLeft - (x - startX) * 2;
    });

    // 5. Lightbox Logic
    const lightbox = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightbox-img");
    const lightboxClose = document.getElementById("lightbox-close");
    let currentImgIdx = 0;
    let lastFocusedElement = null;

    document.querySelectorAll("#carousel-track .gallery-img").forEach((img) => {
        const activate = () => {
            if (isDraggingClick) return;
            const file = img.dataset.file;
            const realIdx = imageFiles.indexOf(file);
            if (realIdx !== -1) {
                openLightbox(realIdx);
            }
        };
        img.addEventListener("click", activate);
        img.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activate();
            }
        });
    });

    function openLightbox(idx) {
        lastFocusedElement = document.activeElement;
        currentImgIdx = idx;
        lbImg.src = `../assets/gallery/${encodeURIComponent(imageFiles[idx])}`;
        lbImg.alt = imageFiles[idx].replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        preloadAdjacent(idx);
        requestAnimationFrame(() => lightboxClose.focus());
    }

    function closeLb() {
        lightbox.hidden = true;
        document.body.style.overflow = "";
        if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
    }

    lightboxClose.addEventListener("click", closeLb);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLb();
    });

    function navigateLb(dir) {
        currentImgIdx =
            (currentImgIdx + dir + imageFiles.length) % imageFiles.length;
        lbImg.src = `../assets/gallery/${encodeURIComponent(imageFiles[currentImgIdx])}`;
        lbImg.alt = imageFiles[currentImgIdx]
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]+/g, " ");
        preloadAdjacent(currentImgIdx);
    }

    function preloadAdjacent(idx) {
        const prev = (idx - 1 + imageFiles.length) % imageFiles.length;
        const next = (idx + 1) % imageFiles.length;
        new Image().src = `../assets/gallery/${encodeURIComponent(imageFiles[prev])}`;
        new Image().src = `../assets/gallery/${encodeURIComponent(imageFiles[next])}`;
    }

    document.addEventListener("keydown", (e) => {
        if (lightbox.hidden) return;
        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowRight") navigateLb(1);
        if (e.key === "ArrowLeft") navigateLb(-1);
        if (e.key === "Tab") {
            e.preventDefault();
            lightboxClose.focus();
        }
    });

    let touchStartX = 0;
    lightbox.addEventListener(
        "touchstart",
        (e) => {
            touchStartX = e.changedTouches[0].screenX;
        },
        { passive: true },
    );

    lightbox.addEventListener(
        "touchend",
        (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 40) navigateLb(1);
            if (touchEndX - touchStartX > 40) navigateLb(-1);
        },
        { passive: true },
    );
}
