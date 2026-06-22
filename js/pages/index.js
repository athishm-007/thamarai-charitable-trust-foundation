// ========================================
// IMPORTS
// ========================================

import {

    getCollection,

    getLatestDocuments,

    getDocument

}
    from "../firebase/firestore.js";

import {

    COLLECTIONS

}
    from "../utils/constants.js";

import {

    formatDate

}
    from "../utils/helpers.js";

import {

    escapeHtml

}
    from "../utils/helpers.js";

import {

    showError

}
    from "../utils/toast.js";

// ========================================
// ELEMENTS
// ========================================

const announcementContainer =
    document.getElementById(
        "announcementContainer"
    );

const upcomingEventsContainer =
    document.getElementById(
        "eventsContainer"
    );

const popupContainer =
    document.getElementById(
        "eventPopup"
    );

const popupCloseBtn =
    document.getElementById(
        "popupCloseBtn"
    );

let allEvents = [];

// ========================================
// INIT
// ========================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        try {

            const [
                events,
                announcements,
                stats,
                testimonials,
                gallery,
                videos,
                assets
            ] = await Promise.all([
                getCollection(COLLECTIONS.EVENTS),
                getLatestDocuments(COLLECTIONS.ANNOUNCEMENTS, 5),
                getDocument(COLLECTIONS.SETTINGS, "homepage"),
                getCollection(COLLECTIONS.TESTIMONIALS),
                getCollection(COLLECTIONS.GALLERY),
                getCollection(COLLECTIONS.VIDEOS),
                getDocument(COLLECTIONS.SETTINGS, "assets")
            ]);

            allEvents = events;

            loadAnnouncements(announcements);

            loadUpcomingEvents(events);

            loadHomepageStats(stats);

            loadTestimonials(testimonials);

            loadGalleryAndVideos(gallery, videos);

            initializePopup(events, assets);

        }
        catch (error) {

            console.error(
                error
            );

            showError(

                "தரவு ஏற்ற முடியவில்லை"

            );

        }

    }

);

// ========================================
// ANNOUNCEMENTS
// ========================================

function loadAnnouncements(announcements) {
    if (
        !announcementContainer
    ) {
        return;
    }

    if (
        !announcements || announcements.length === 0
    ) {
        announcementContainer.innerHTML =

            `
            <div class="empty-state">

                தற்போது அறிவிப்புகள் எதுவும் இல்லை.

            </div>
        `;

        return;
    }

    announcementContainer.innerHTML = `
        <div class="ticker-track">
            ${announcements.map(
        announcement => `
                    <div class="announcement-card">
                        <p>${escapeHtml(announcement.text)}</p>
                    </div>
                `
    ).join("")}
        </div>
    `;
}

// ========================================
// UPCOMING EVENTS
// ========================================

function loadUpcomingEvents(events) {
    if (
        !upcomingEventsContainer
    ) {
        return;
    }

    const upcomingEvents =

        events.filter(

            event =>

                event.status?.toLowerCase() ===
                "upcoming"

        );

    if (
        upcomingEvents.length === 0
    ) {
        upcomingEventsContainer.innerHTML =

            `
            <div class="empty-state">

                தற்போது வரவிருக்கும் நிகழ்வுகள் எதுவும் இல்லை.

            </div>
        `;

        return;
    }

    upcomingEventsContainer.innerHTML =

        upcomingEvents.map(

            event =>

                `
                <div class="event-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                    ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${escapeHtml(event.title)}" style="width: 100%; height: 200px; object-fit: contain; background-color: var(--bg-light);" />` : ''}
                    <div class="event-card-content" style="padding: 24px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <h3 style="margin-top: 0; color: var(--primary); font-size: 1.25rem; font-weight: 800; margin-bottom: 12px;">
                                ${escapeHtml(event.title)}
                            </h3>
                            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px; line-height: 1.6;">
                                ${escapeHtml(event.description || "விவரம் இல்லை")}
                            </p>
                            <p style="margin-bottom: 8px; font-size: 0.9rem;">
                                <strong>தேதி:</strong> ${formatDate(event.date)}
                            </p>
                            <p style="margin-bottom: 16px; font-size: 0.9rem;">
                                <strong>இடம்:</strong> ${escapeHtml(event.location || "இடம் குறிப்பிடப்படவில்லை")}
                            </p>
                        </div>
                        <button class="register-event-btn" data-title="${escapeHtml(event.title)}" style="background-color: var(--primary); color: white; border: none; padding: 10px 16px; border-radius: var(--radius-sm); font-weight: bold; cursor: pointer; transition: background-color 0.3s; width: 100%;">
                            பதிவு செய்க
                        </button>
                    </div>
                </div>
            `

        ).join("");

    // Bind click event to Register buttons
    upcomingEventsContainer.querySelectorAll(".register-event-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const eventTitle = encodeURIComponent(btn.dataset.title);
            window.location.href = `events.html?event=${eventTitle}`;
        });
    });
}

// ========================================
// POPUP EVENT
// ========================================

function initializePopup(events, assets) {
    if (
        !popupContainer
    ) {
        return;
    }

    const popupEvent =

        events.find(

            event =>

                event.popup === true

        );

    if (
        !popupEvent
    ) {
        popupContainer.style.display =
            "none";

        return;
    }

    const popupTitle =
        document.getElementById(
            "popupEventTitle"
        );

    const popupDescription =
        document.getElementById(
            "popupEventDescription"
        );

    const popupDate = document.getElementById("popupEventDate");
    const popupLocation = document.getElementById("popupEventLocation");

    const popupBanner = document.getElementById("popupEventBanner");
    if (popupBanner) {
        popupBanner.src = popupEvent.imageUrl || assets?.eventBannerUrl || "images/event-banner.jpg";
    }

    if (
        popupTitle
    ) {
        popupTitle.textContent =
            popupEvent.title;
    }

    if (
        popupDescription
    ) {
        popupDescription.textContent =
            popupEvent.description || "";
    }

    if (popupDate) {
        popupDate.innerHTML = `📅 <strong>தேதி:</strong> ${formatDate(popupEvent.date)}`;
    }

    if (popupLocation) {
        popupLocation.innerHTML = `📍 <strong>இடம்:</strong> ${popupEvent.location || "இடம் குறிப்பிடப்படவில்லை"}`;
    }

    setTimeout(

        () => {

            popupContainer.classList.add(
                "active"
            );

        },

        1500

    );
}

// ========================================
// CLOSE POPUP
// ========================================

if (popupCloseBtn) {
    popupCloseBtn.addEventListener("click", () => {
        popupContainer?.classList.remove("active");
    });
}

const popupViewBtn = document.getElementById("popupViewBtn");
if (popupViewBtn) {
    popupViewBtn.addEventListener("click", () => {
        popupContainer?.classList.remove("active");
    });
}

// ========================================
// HOMEPAGE STATS COUNTERS
// ========================================

function loadHomepageStats(stats) {
    if (stats) {
        const familiesHelpedCount = document.getElementById("familiesHelpedCount");
        const studentsSupportedCount = document.getElementById("studentsSupportedCount");
        const issuesSolvedCounter = document.getElementById("issuesSolvedCounter");
        const eventsConductedCount = document.getElementById("eventsConductedCount");

        if (familiesHelpedCount) familiesHelpedCount.textContent = stats.families ?? 0;
        if (studentsSupportedCount) studentsSupportedCount.textContent = stats.students ?? 0;
        if (issuesSolvedCounter) issuesSolvedCounter.textContent = stats.issuesSolved ?? 0;
        if (eventsConductedCount) eventsConductedCount.textContent = stats.events ?? 0;
    }
}

// ========================================
// TESTIMONIALS
// ========================================

function loadTestimonials(testimonials) {
    const testimonialsContainer = document.getElementById("testimonialsContainer");
    if (!testimonialsContainer) {
        return;
    }

    if (!testimonials || testimonials.length === 0) {
        testimonialsContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 20px;">
                தற்போது கருத்துக்கள் எதுவும் இல்லை.
            </div>
        `;
        return;
    }

    testimonialsContainer.innerHTML = testimonials.map(testimonial => `
        <div class="testimonial-card">
            <p>"${escapeHtml(testimonial.message)}"</p>
            <span>- ${escapeHtml(testimonial.name)}</span>
        </div>
    `).join("");
}


// ========================================
// GALLERY & VIDEOS
// ========================================
function loadGalleryAndVideos(gallery, videos) {
    const galleryContainer = document.getElementById("galleryContainer");
    const videoContainer = document.getElementById("videoContainer");

    try {
        // Load Gallery Images
        if (galleryContainer) {
            if (!gallery || gallery.length === 0) {
                galleryContainer.innerHTML = `<div class="empty-state" style="text-align: center; color: #666; font-style: italic;">புகைப்படங்கள் எதுவும் இல்லை.</div>`;
            } else {
                galleryContainer.innerHTML = gallery.map(item => `
                    <div class="gallery-card">
                        <img src="${item.imageUrl}" alt="Gallery Image" loading="lazy" />
                    </div>
                `).join("");
            }
        }

        // Load Videos
        if (videoContainer) {
            if (!videos || videos.length === 0) {
                videoContainer.innerHTML = "";
            } else {
                videoContainer.innerHTML = videos.map(video => {
                    let embedUrl = video.url;
                    if (video.url.includes("youtube.com/watch?v=")) {
                        const videoId = video.url.split("v=")[1]?.split("&")[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    } else if (video.url.includes("youtu.be/")) {
                        const videoId = video.url.split("youtu.be/")[1]?.split("?")[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    } else if (video.url.includes("youtube.com/shorts/")) {
                        const videoId = video.url.split("shorts/")[1]?.split("?")[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    } else if (video.url.includes("youtube.com/embed/")) {
                        embedUrl = video.url;
                    }

                    return `
                        <div class="video-card">
                            <iframe src="${embedUrl}" allowfullscreen></iframe>
                        </div>
                    `;
                }).join("");
            }
        }

        // Wire up the auto-moving sliders + lightbox now that the DOM exists
        initGallerySliders();
        initLightbox();

    } catch (error) {
        console.error("Error loading gallery and videos:", error);
    }
}

// ========================================
// GALLERY / VIDEO CARD STACKS
// ========================================

const SLIDE_INTERVAL_MS = 1500; // how long each card stays on top before cycling
const MAX_VISIBLE_DEPTH = 4;    // how many cards peek out behind the front one

function createCardStack({ containerId, prevBtnId, nextBtnId, paginationId, itemSelector }) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const items = Array.from(container.querySelectorAll(itemSelector));
    if (items.length === 0) return null;

    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const pagination = document.getElementById(paginationId);

    let currentIndex = 0;
    let timer = null;

    // Build pagination dots (skip entirely if there's nothing to navigate between)
    if (pagination) {
        if (items.length > 1) {
            pagination.style.display = "flex";
            pagination.innerHTML = items
                .map((_, i) => `<span class="slider-dot${i === 0 ? " active" : ""}" data-index="${i}"></span>`)
                .join("");
        } else {
            pagination.style.display = "none";
            pagination.innerHTML = "";
        }
    }

    // Lays every card out relative to the current front card: the front
    // card sits centered and flat, and each card behind it fans out to
    // alternating sides, slightly smaller, rotated, and lower in z-index.
    function layoutStack() {
        const total = items.length;

        items.forEach((item, i) => {
            const depth = (i - currentIndex + total) % total;

            if (depth > MAX_VISIBLE_DEPTH) {
                // Tucked completely out of sight at the back of the deck
                item.style.opacity = "0";
                item.style.transform = "translate3d(0, 40px, 0) scale(0.7)";
                item.style.zIndex = "0";
                item.style.pointerEvents = "none";
                return;
            }

            const side = depth % 2 === 0 ? 1 : -1;
            const translateX = depth === 0 ? 0 : side * depth * 16;
            const translateY = depth * 12;
            const rotate = depth === 0 ? 0 : side * depth * 3.5;
            const scale = 1 - depth * 0.07;

            item.style.transform =
                `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotate}deg) scale(${scale})`;
            item.style.opacity = String(1 - depth * 0.08);
            item.style.zIndex = String(total - depth);
            item.style.pointerEvents = depth === 0 ? "auto" : "none";
        });

        if (pagination) {
            pagination.querySelectorAll(".slider-dot").forEach((dot, i) => {
                dot.classList.toggle("active", i === currentIndex);
            });
        }
    }

    function goTo(index) {
        const total = items.length;
        currentIndex = ((index % total) + total) % total;
        layoutStack();
    }

    function next() {
        goTo(currentIndex + 1);
    }

    function prev() {
        goTo(currentIndex - 1);
    }

    function startAutoplay() {
        stopAutoplay();
        if (items.length > 1) {
            timer = setInterval(next, SLIDE_INTERVAL_MS);
        }
    }

    function stopAutoplay() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // Nav buttons
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            prev();
            startAutoplay(); // reset the timer after manual navigation
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            next();
            startAutoplay();
        });
    }

    // Pagination dots
    if (pagination) {
        pagination.addEventListener("click", (e) => {
            const dot = e.target.closest(".slider-dot");
            if (!dot) return;
            goTo(Number(dot.dataset.index));
            startAutoplay();
        });
    }

    // Pause on hover/touch so users can look without the stack shuffling away
    container.addEventListener("mouseenter", stopAutoplay);
    container.addEventListener("mouseleave", startAutoplay);

    layoutStack();
    startAutoplay();

    return { goTo, next, prev, startAutoplay, stopAutoplay };
}

function initGallerySliders() {
    createCardStack({
        containerId: "galleryContainer",
        prevBtnId: "galleryPrevBtn",
        nextBtnId: "galleryNextBtn",
        paginationId: "galleryPagination",
        itemSelector: ".gallery-card"
    });

    createCardStack({
        containerId: "videoContainer",
        prevBtnId: "videoPrevBtn",
        nextBtnId: "videoNextBtn",
        paginationId: "videoPagination",
        itemSelector: ".video-card"
    });
}

// ========================================
// LIGHTBOX (full-screen image view)
// ========================================

function initLightbox() {
    const lightboxModal = document.getElementById("lightboxModal");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCloseBtn = document.getElementById("lightboxCloseBtn");
    const galleryContainer = document.getElementById("galleryContainer");

    if (!lightboxModal || !lightboxImg || !galleryContainer) return;

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || "Gallery Image";
        lightboxModal.classList.add("active");
        document.body.classList.add("lightbox-open");
    }

    function closeLightbox() {
        lightboxModal.classList.remove("active");
        document.body.classList.remove("lightbox-open");
        lightboxImg.src = "";
    }

    galleryContainer.addEventListener("click", (e) => {
        const img = e.target.closest(".gallery-card img");
        if (!img) return;
        openLightbox(img.src, img.alt);
    });

    if (lightboxCloseBtn) {
        lightboxCloseBtn.addEventListener("click", closeLightbox);
    }

    // Click outside the image (on the dark backdrop) also closes it
    lightboxModal.addEventListener("click", (e) => {
        if (e.target === lightboxModal) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && lightboxModal.classList.contains("active")) {
            closeLightbox();
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Prevent scrolling while preloader is active
    document.body.classList.add("preloader-active");
});

window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    if (preloader) {
        // Wait 1.2 seconds (1200ms) after load
        setTimeout(() => {
            preloader.classList.add("fade-out");
            document.body.classList.remove("preloader-active");
        }, 1200);
    }
});

// Failsafe timeout: Hide the loader after 6 seconds even if a network request hangs
setTimeout(() => {
    const preloader = document.getElementById("preloader");
    if (preloader && !preloader.classList.contains("fade-out")) {
        preloader.classList.add("fade-out");
        document.body.classList.remove("preloader-active");
    }
}, 6000);