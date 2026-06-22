// ========================================
// IMPORTS
// ========================================

import {

    getCollection,

    createDocument,

    serverTimestamp

}
    from "../firebase/firestore.js";



import {

    COLLECTIONS,

    EVENT_STATUS

}
    from "../utils/constants.js";

import {

    formatDate,
    escapeHtml

}
    from "../utils/helpers.js";

import {

    showError,

    showSuccess

}
    from "../utils/toast.js";

import {
    isValidMobile,
    isValidEmail
}
    from "../utils/validators.js";

// ========================================
// ELEMENTS
// ========================================

const upcomingEventsContainer =
    document.getElementById(
        "upcomingEventsContainer"
    );

const eventSelect =
    document.getElementById(
        "eventSelect"
    );

const eventRegistrationForm =
    document.getElementById(
        "eventRegistrationForm"
    );

let allEvents = [];

// ========================================
// INIT
// ========================================

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        try {

            allEvents =

                await getCollection(
                    COLLECTIONS.EVENTS
                );

            await loadUpcomingEvents();

            await populateEventDropdown();

            initializeRegistration();

            // Check for event query parameter from homepage
            const urlParams = new URLSearchParams(window.location.search);
            const eventParam = urlParams.get("event");
            if (eventParam && eventSelect) {
                eventSelect.value = eventParam;
                const registrationSection = document.getElementById("event-registration");
                if (registrationSection) {
                    setTimeout(() => {
                        registrationSection.scrollIntoView({ behavior: "smooth" });
                    }, 500);
                }
            }

        }
        catch (error) {

            console.error(
                error
            );

            showError(

                "நிகழ்வுகளை ஏற்ற முடியவில்லை"

            );

        }

    }

);

// ========================================
// UPCOMING EVENTS
// ========================================

async function loadUpcomingEvents() {
    if (
        !upcomingEventsContainer
    ) {
        return;
    }

    const events = allEvents;

    const upcomingEvents =

        events

            .filter(

                event =>

                    event.status ===
                    EVENT_STATUS.UPCOMING

            )

            .sort(

                (a, b) =>

                    new Date(
                        a.date
                    )

                    -

                    new Date(
                        b.date
                    )

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
                    ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${escapeHtml(event.title)}" style="width: 100%; height: 200px; object-fit: cover;" />` : ''}
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
                            பதிவு செய்க (Register)
                        </button>
                    </div>
                </div>
            `

        ).join("");

    // Bind event handlers to Register buttons
    upcomingEventsContainer.querySelectorAll(".register-event-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const eventTitle = btn.dataset.title;
            if (eventSelect) {
                eventSelect.value = eventTitle;
            }
            const registrationSection = document.getElementById("event-registration");
            if (registrationSection) {
                registrationSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
}

// ========================================
// EVENT DROPDOWN
// ========================================

async function populateEventDropdown() {
    if (
        !eventSelect
    ) {
        return;
    }

    const events = allEvents;

    const upcomingEvents =

        events

            .filter(

                event =>

                    event.status ===
                    EVENT_STATUS.UPCOMING

            )

            .sort(

                (a, b) =>

                    new Date(
                        a.date
                    )

                    -

                    new Date(
                        b.date
                    )

            );

    if (
        upcomingEvents.length === 0
    ) {
        eventSelect.innerHTML =

            `
            <option>

                தற்போது நிகழ்வுகள் இல்லை

            </option>
        `;

        return;
    }

    eventSelect.innerHTML =

        upcomingEvents.map(

            event =>

                `
                <option
                    value="${event.title}"
                >

                    ${event.title}

                </option>
            `

        ).join("");

}

// ========================================
// EVENT REGISTRATION
// ========================================

function initializeRegistration() {
    if (
        !eventRegistrationForm
    ) {
        return;
    }

    eventRegistrationForm.addEventListener(

        "submit",

        handleEventRegistration

    );
}

async function handleEventRegistration(
    event
) {
    event.preventDefault();

    try {

        const formData =

            new FormData(
                eventRegistrationForm
            );

        const fullName = formData.get("fullName")?.trim();
        const mobile = formData.get("mobile")?.trim();
        const email = formData.get("email")?.trim();

        if (
            !fullName ||
            !mobile ||
            !email
        ) {
            throw new Error(
                "அனைத்து கட்டாய விவரங்களையும் நிரப்பவும்"
            );
        }

        if (!isValidMobile(mobile)) {
            throw new Error("சரியான மொபைல் எண்ணை உள்ளிடவும்");
        }

        if (!isValidEmail(email)) {
            throw new Error("சரியான மின்னஞ்சலை உள்ளிடவும்");
        }


        const registrationId =

            await createDocument(

                COLLECTIONS.EVENT_REGISTRATIONS,

                {

                    fullName:
                        formData.get(
                            "fullName"
                        )?.trim(),

                    mobile:
                        formData.get(
                            "mobile"
                        )?.trim(),

                    email:
                        formData.get(
                            "email"
                        )?.trim(),

                    memberId:
                        formData.get(
                            "memberId"
                        )?.trim(),

                    address:
                        formData.get(
                            "address"
                        )?.trim(),

                    eventName:
                        formData.get(
                            "eventName"
                        ),

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }

            );



        document.getElementById(
            "event-registration"
        ).style.display =
            "none";

        document.getElementById(
            "registration-success"
        ).style.display =
            "block";

        document.getElementById(
            "registrationNumber"
        ).textContent =

            registrationId;

        showSuccess(

            "நிகழ்வு பதிவு வெற்றிகரமாக முடிந்தது"

        );

        eventRegistrationForm.reset();

    }
    catch (error) {

        console.error(
            error
        );

        showError(

            "நிகழ்வில் பதிவு செய்ய முடியவில்லை"

        );

    }
}