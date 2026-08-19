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
                if (targetEl) targetEl.scrollIntoView({ behavior: "smooth" });
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
    const smileySvg = document.getElementById("smiley-svg");
    if (smileySvg) {
        smileySvg.addEventListener("click", () => {
            if (smileySvg.classList.contains("winking")) return;
            smileySvg.classList.add("winking");
            setTimeout(() => smileySvg.classList.remove("winking"), 700);
        });
    }

    // --- Menu Dropdown Logic & Easter Egg ---
    const logoBtn = document.getElementById("logo-btn");
    const menuDropdown = document.getElementById("menu-dropdown");

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
    initGallery();
});

async function initGallery() {
    const carousel = document.querySelector(".carousel-container");
    const track = document.getElementById("carousel-track");
    let imageFiles = [];

    // 1. Load Images dynamically
    try {
        const response = await fetch("gallery/gallery.json");
        if (!response.ok) throw new Error("Network response was not ok");
        imageFiles = await response.json();
    } catch (e) {
        console.error(
            "Failed to load gallery.json, falling back to empty gallery.",
            e,
        );
        return;
    }

    track.innerHTML = "";

    // Create master group
    const group = document.createElement("div");
    group.className = "gallery-group";

    imageFiles.forEach((file) => {
        const img = document.createElement("img");
        img.className = "gallery-img";
        img.src = `gallery/${file}`;
        img.alt = file.split(".")[0];
        img.loading = "lazy";
        group.appendChild(img);
    });

    // Append the master group to track
    track.appendChild(group);

    // Clone twice for true mathematical infinite scrolling in both directions
    const clone1 = group.cloneNode(true);
    clone1.setAttribute("aria-hidden", "true");
    track.appendChild(clone1);

    const clone2 = group.cloneNode(true);
    clone2.setAttribute("aria-hidden", "true");
    track.appendChild(clone2);

    // 2. Setup Infinite Scroll & Auto-Scroll
    let isAutoScrolling = true;
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
            isAutoScrolling = true;
        }, 2000);
    }

    ["pointerdown", "touchstart", "wheel"].forEach((evt) => {
        carousel.addEventListener(evt, stopCarousel, { passive: true });
    });
    ["pointerup", "touchend", "mouseleave"].forEach((evt) => {
        carousel.addEventListener(evt, startCarousel, { passive: true });
    });
    carousel.addEventListener("mouseenter", stopCarousel);

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
    let currentImgIdx = 0;

    document.querySelectorAll("#carousel-track .gallery-img").forEach((img) => {
        img.addEventListener("click", () => {
            if (isDraggingClick) return;
            const file = img.getAttribute("src").replace("gallery/", "");
            const realIdx = imageFiles.indexOf(file);
            if (realIdx !== -1) {
                openLightbox(realIdx);
            }
        });
    });

    function openLightbox(idx) {
        currentImgIdx = idx;
        lbImg.src = `gallery/${imageFiles[idx]}`;
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        preloadAdjacent(idx);
    }

    function closeLb() {
        lightbox.hidden = true;
        document.body.style.overflow = "";
    }

    document
        .getElementById("lightbox-close")
        .addEventListener("click", closeLb);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLb();
    });

    function navigateLb(dir) {
        currentImgIdx =
            (currentImgIdx + dir + imageFiles.length) % imageFiles.length;
        lbImg.src = `gallery/${imageFiles[currentImgIdx]}`;
        preloadAdjacent(currentImgIdx);
    }

    function preloadAdjacent(idx) {
        const prev = (idx - 1 + imageFiles.length) % imageFiles.length;
        const next = (idx + 1) % imageFiles.length;
        new Image().src = `gallery/${imageFiles[prev]}`;
        new Image().src = `gallery/${imageFiles[next]}`;
    }

    document.addEventListener("keydown", (e) => {
        if (lightbox.hidden) return;
        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowRight") navigateLb(1);
        if (e.key === "ArrowLeft") navigateLb(-1);
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
