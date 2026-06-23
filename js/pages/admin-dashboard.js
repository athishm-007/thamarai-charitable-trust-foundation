// ========================================
// IMPORTS
// ========================================

import {

    watchAuth,

    logout,

    isAdmin

}
    from "../firebase/auth.js";

import { sendMemberStatusNotification } from "../utils/email.js";

import {

    getCollection,

    updateDocument,

    deleteDocument,

    createDocument,

    generateMemberNumber,

    getDocument,

    setDocument,

    serverTimestamp,

    queryByField

}
    from "../firebase/firestore.js";

import {

    deleteGovernmentProof,

    getGovernmentProofUrl,

    uploadGalleryImage,

    uploadEventImage,

    uploadSignature,

    uploadMemberPhoto,

    deleteFile,

    uploadQrCode

}
    from "../firebase/storage.js";

import {
    formatDate,
    formatDateTime,
    getMemberStatusTamil,
    getMemberTypeTamil,
    getProblemStatusTamil,
    getBloodStatusTamil,
    escapeHtml
}
    from "../utils/helpers.js";

import {

    showSuccess,

    showError

}
    from "../utils/toast.js";

import {

    COLLECTIONS,

    MEMBER_STATUS,

    BLOOD_REQUEST_STATUS,

    EVENT_STATUS

}
    from "../utils/constants.js";

// ========================================
// ELEMENTS
// ========================================

const adminInfo =
    document.getElementById(
        "adminInfo"
    );

const adminLogoutBtn =
    document.getElementById(
        "adminLogoutBtn"
    );

const memberApprovalsTableBody =
    document.getElementById(
        "memberApprovalsTableBody"
    );

const membersTableBody =
    document.getElementById(
        "membersTableBody"
    );

const eventsTableBody =
    document.getElementById(
        "eventsTableBody"
    );

const bloodDonorsTableBody =
    document.getElementById(
        "bloodDonorsTableBody"
    );

const bloodRequestsTableBody =
    document.getElementById(
        "bloodRequestsTableBody"
    );

const problemReportsTableBody =
    document.getElementById(
        "problemReportsTableBody"
    );

const contactMessagesTableBody =
    document.getElementById(
        "contactMessagesTableBody"
    );


const dashboardLoader =
    document.getElementById(
        "dashboardLoader"
    );

const eventRegistrationsTableBody =
    document.getElementById(
        "eventRegistrationsTableBody"
    );

const donationsTableBody =
    document.getElementById(
        "donationsTableBody"
    );

const videoPreviewContainer =
    document.getElementById(
        "videoPreviewContainer"
    );

const createEventBtn =
    document.getElementById(
        "createEventBtn"
    );

const galleryUploadInput =
    document.getElementById(
        "galleryUploadInput"
    );

const uploadGalleryBtn =
    document.getElementById(
        "uploadGalleryBtn"
    );

const youtubeLinkInput =
    document.getElementById(
        "youtubeLinkInput"
    );

const addYoutubeBtn =
    document.getElementById(
        "addYoutubeBtn"
    );

const announcementText =
    document.getElementById(
        "announcementText"
    );

const publishAnnouncementBtn =
    document.getElementById(
        "publishAnnouncementBtn"
    );

const announcementsTableBody =
    document.getElementById(
        "announcementsTableBody"
    );

const saveHomepageStatsBtn =
    document.getElementById(
        "saveHomepageStatsBtn"
    );

const savePaymentSettingsBtn =
    document.getElementById(
        "savePaymentSettingsBtn"
    );

const upiInput =
    document.getElementById(
        "upiInput"
    );

const qrUpload =
    document.getElementById(
        "qrUpload"
    );

const signatureUpload = document.getElementById("signatureUpload");
const defaultPhotoUpload = document.getElementById("defaultPhotoUpload");
const saveAssetSettingsBtn = document.getElementById("saveAssetSettingsBtn");
const currentSignaturePreview = document.getElementById("currentSignaturePreview");
const currentDefaultPhotoPreview = document.getElementById("currentDefaultPhotoPreview");


// ========================================
// AUTH CHECK
// ========================================

watchAuth(async (user) => {
    if (!user) {
        location.href = "admin-login.html";
        return;
    }
    const adminCheck = await isAdmin(user.uid);
    if (!adminCheck) {
        location.href = "admin-login.html";
        return;
    }
    initializeDashboard(user);
});

// ========================================
// STATE MANAGEMENT & CACHING
// ========================================

let dashboardState = {
    members: [],
    bloodDonors: [],
    bloodRequests: [],
    eventRegistrations: [],
    donations: [],
    problems: [],
    contactMessages: [],
    events: [],
    announcements: [],
    testimonials: [],
    gallery: [],
    videos: []
};

async function fetchAllDashboardData() {
    const [
        members,
        bloodDonors,
        bloodRequests,
        eventRegistrations,
        donations,
        problems,
        contactMessages,
        events,
        announcements,
        testimonials,
        gallery,
        videos
    ] = await Promise.all([
        getCollection(COLLECTIONS.MEMBERS),
        getCollection(COLLECTIONS.BLOOD_DONORS),
        getCollection(COLLECTIONS.BLOOD_REQUESTS),
        getCollection(COLLECTIONS.EVENT_REGISTRATIONS),
        getCollection(COLLECTIONS.DONATIONS),
        getCollection(COLLECTIONS.GRIEVANCES),
        getCollection(COLLECTIONS.CONTACT_MESSAGES),
        getCollection(COLLECTIONS.EVENTS),
        getCollection(COLLECTIONS.ANNOUNCEMENTS),
        getCollection(COLLECTIONS.TESTIMONIALS),
        getCollection(COLLECTIONS.GALLERY),
        getCollection(COLLECTIONS.VIDEOS)
    ]);

    dashboardState = {
        members,
        bloodDonors,
        bloodRequests,
        eventRegistrations,
        donations,
        problems,
        contactMessages,
        events,
        announcements,
        testimonials,
        gallery,
        videos
    };
}

// ========================================
// INIT
// ========================================

async function initializeDashboard(
    user
) {
    try {

        if (dashboardLoader) {
            dashboardLoader.style.display =
                "block";
        }

        if (adminInfo) {
            adminInfo.textContent =
                "வரவேற்கிறோம், நிர்வாகி";
        }

        await fetchAllDashboardData();

        await Promise.all([
            loadStatistics(),
            loadPendingMembers(),
            loadApprovedMembers(),
            loadEvents(),
            loadEventRegistrations(),
            loadDonations(),
            loadBloodDonors(),
            loadBloodRequests(),
            loadProblems(),
            loadContactMessages(),
            loadTestimonials(),
            loadGalleryPreviews(),
            loadVideoPreviews(),
            loadPaymentSettings(),
            loadHomepageStatsSettings(),
            loadAssetSettings(),
            loadAnnouncements()
        ]);
    }
    catch (error) {
        if (dashboardLoader) {
            dashboardLoader.style.display =
                "none";
        }
        console.error(error);
        showError("தரவை ஏற்ற முடியவில்லை");
    }

    if (dashboardLoader) {
        dashboardLoader.style.display =
            "none";
    }
}

// ========================================
// STATISTICS
// ========================================

async function loadStatistics() {
    const members = dashboardState.members;
    const donors = dashboardState.bloodDonors;
    const requests = dashboardState.bloodRequests;
    const registrations = dashboardState.eventRegistrations;
    const donations = dashboardState.donations;

    const pendingMembers =
        members.filter(
            member =>
                member.status ===
                MEMBER_STATUS.PENDING
        );

    // Filter to count only Approved and Active Members
    const activeApproved = members.filter(
        m => m.status === MEMBER_STATUS.APPROVED && m.active !== false && m.active !== "false"
    );

    setText(
        "totalMembers",
        activeApproved.length
    );

    setText(
        "pendingApprovals",
        pendingMembers.length
    );

    setText(
        "eventRegistrationsCount",
        registrations.length
    );

    setText(
        "donationsCount",
        donations.length
    );

    setText(
        "bloodDonorsCount",
        donors.length
    );

    setText(
        "bloodRequestsCount",
        requests.length
    );
}

// ========================================
// PENDING MEMBERS
// ========================================

async function loadPendingMembers() {
    if (
        !memberApprovalsTableBody
    ) {
        return;
    }

    const members = dashboardState.members;

    const pendingMembers =

        members.filter(

            member =>

                member.status ===
                MEMBER_STATUS.PENDING

        );

    memberApprovalsTableBody.innerHTML =
        "";

    pendingMembers.forEach(
        member => {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML =

                `
                <td>${member.fullName}</td>

                <td>
                    ${member.photoUrl ? `<img src="${member.photoUrl}" alt="Photo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);" />` : `<img src="images/default-user.jpg" alt="Default User" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);" />`}
                </td>

                <td>${member.mobile}</td>

                <td>${member.email}</td>

                <td>
                    <span class="member-type-badge ${member.memberType === 'active-member' ? 'badge-active' : 'badge-member'
                }">${getMemberTypeTamil(member.memberType)}</span>
                </td>

                <td>${getMemberStatusTamil(member.status)}</td>


                <td>

                    <button
                        class="view-pending-member"
                        data-id="${member.id}"
                        style="background-color: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                    >
                        பார்
                    </button>

                    <button
                        class="approve-member"
                        data-id="${member.id}"
                    >
                        ஒப்புதல்
                    </button>

                    <button
                        class="reject-member"
                        data-id="${member.id}"
                        data-proof="${member.governmentProofPath || ""}"
                        data-photo="${member.photoUrl || ""}"
                    >
                        நிராகரி
                    </button>

                </td>
            `;

            memberApprovalsTableBody
                .appendChild(
                    row
                );

        });

    bindApprovalButtons();
}

// ========================================
// APPROVE MEMBER
// ========================================

function bindApprovalButtons() {
    document.querySelectorAll(".view-pending-member").forEach(button => {
        button.addEventListener("click", async () => {
            const memberId = button.dataset.id;
            try {
                if (dashboardLoader) dashboardLoader.style.display = "block";
                const member = await getDocument(COLLECTIONS.MEMBERS, memberId);
                if (member) {
                    const proofUrl = await getGovernmentProofUrl(member.governmentProofPath);
                    showDetailModal("விண்ணப்பதாரர் விவரங்கள் (Pending Member Details)", [
                        { label: "முழு பெயர் (Full Name)", value: member.fullName },
                        { label: "தந்தை பெயர் (Father's Name)", value: member.fatherName || "-" },
                        { label: "புகைப்படம் (Photo)", value: member.photoUrl, isImage: true },
                        { label: "மின்னஞ்சல் (Email)", value: member.email },
                        { label: "கைபேசி எண் (Mobile)", value: member.mobile },
                        { label: "பாலினம் (Gender)", value: member.gender === "male" ? "ஆண் (Male)" : member.gender === "female" ? "பெண் (Female)" : "மற்றவை (Other)" },
                        { label: "பிறந்த தேதி (DOB)", value: member.dob },
                        { label: "இரத்த வகை (Blood Group)", value: member.bloodGroup },
                        { label: "தொழில் (Occupation)", value: member.occupation || "-" },
                        { label: "முகவரி (Address)", value: member.address },
                        { label: "ஏன் இணைய விரும்புகிறார் (Reason to Join)", value: member.whyJoin || "-" },
                        { label: "உறுப்பினர் வகை (Member Type)", value: getMemberTypeTamil(member.memberType) },
                        { label: "அரசு அடையாள ஆவணம் (Gov ID Proof)", value: proofUrl, isImage: true },
                        { label: "ஆவண இணைப்பு (Proof Link)", value: proofUrl, isLink: true }
                    ]);
                }
            } catch (err) {
                console.error(err);
                showError("விவரங்களை ஏற்ற முடியவில்லை");
            } finally {
                if (dashboardLoader) dashboardLoader.style.display = "none";
            }
        });
    });

    document
        .querySelectorAll(
            ".approve-member"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        try {
                            const memberId = button.dataset.id;
                            const member = await getDocument(COLLECTIONS.MEMBERS, memberId);

                            if (!member) {
                                throw new Error("உறுப்பினர் விவரங்கள் கிடைக்கவில்லை");
                            }

                            const memberNumber = await generateMemberNumber();

                            await updateDocument(
                                COLLECTIONS.MEMBERS,
                                memberId,
                                {
                                    status: MEMBER_STATUS.APPROVED,
                                    memberNumber,
                                    approvedAt: serverTimestamp(),
                                    governmentProofPath: null
                                }
                            );

                            // Send member status notification email
                            try {
                                if (member.email) {
                                    await sendMemberStatusNotification(
                                        member.email,
                                        "approved",
                                        member.fullName,
                                        memberNumber
                                    );
                                }
                            } catch (emailErr) {
                                console.error("Could not send approval confirmation email:", emailErr);
                            }

                            try {
                                if (
                                    member.governmentProofPath
                                ) {
                                    await deleteGovernmentProof(
                                        member.governmentProofPath
                                    );
                                }
                            } catch (storageError) {
                                console.warn("Storage deletion warning (file might not exist):", storageError);
                            }

                            showSuccess("உறுப்பினர் ஒப்புதல் வழங்கப்பட்டது");

                            await fetchAllDashboardData();
                            await loadStatistics();
                            await loadPendingMembers();
                            await loadApprovedMembers();

                        }
                        catch (error) {

                            console.error(
                                error
                            );

                            showError(

                                "ஒப்புதல் வழங்க முடியவில்லை"

                            );

                        }

                    }

                );

            }

        );

    document
        .querySelectorAll(
            ".reject-member"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    async () => {

                        try {

                            const memberId =
                                button.dataset.id;

                            const proofPath =
                                button.dataset.proof;

                            const photoUrl =
                                button.dataset.photo;

                            // Fetch member details for email notification
                            let memberName = "விண்ணப்பதாரர்";
                            let memberEmail = "";
                            try {
                                const memberDoc = await getDocument(COLLECTIONS.MEMBERS, memberId);
                                if (memberDoc) {
                                    memberName = memberDoc.fullName || "விண்ணப்பதாரர்";
                                    memberEmail = memberDoc.email;
                                }
                            } catch (fetchErr) {
                                console.warn("Could not fetch member doc for rejection notification:", fetchErr);
                            }

                            await updateDocument(

                                COLLECTIONS.MEMBERS,

                                memberId,

                                {

                                    status:
                                        MEMBER_STATUS.REJECTED,

                                    governmentProofPath:
                                        null,

                                    photoUrl:
                                        null

                                }

                            );

                            // Send member rejection email
                            try {
                                if (memberEmail) {
                                    await sendMemberStatusNotification(
                                        memberEmail,
                                        "rejected",
                                        memberName
                                    );
                                }
                            } catch (emailErr) {
                                console.error("Could not send rejection notification email:", emailErr);
                            }

                            try {
                                if (
                                    proofPath
                                ) {
                                    await deleteGovernmentProof(
                                        proofPath
                                    );
                                }
                            } catch (storageError) {
                                console.warn("Storage deletion warning for government proof:", storageError);
                            }

                            try {
                                if (
                                    photoUrl
                                ) {
                                    const photoPath = getPathFromUrl(photoUrl);
                                    if (photoPath) {
                                        await deleteFile(photoPath);
                                    }
                                }
                            } catch (storageError) {
                                console.warn("Storage deletion warning for member photo:", storageError);
                            }


                            showSuccess(

                                "உறுப்பினர் நிராகரிக்கப்பட்டார்"

                            );

                            await fetchAllDashboardData();
                            await loadStatistics();
                            await loadPendingMembers();
                            await loadApprovedMembers();


                        }
                        catch (error) {

                            console.error(
                                error
                            );

                            showError(

                                "நிராகரிக்க முடியவில்லை"

                            );

                        }

                    }

                );

            }

        );
}

// ========================================
// APPROVED MEMBERS
// ========================================

async function loadApprovedMembers() {
    if (
        !membersTableBody
    ) {
        return;
    }

    const members = dashboardState.members;

    const approved =

        members.filter(

            member =>

                member.status ===
                MEMBER_STATUS.APPROVED &&

                member.active !== false &&

                member.active !== "false"

        );

    membersTableBody.innerHTML =

        approved.map(

            member =>

                `
                <tr>

                    <td>${member.memberNumber || "-"}</td>

                    <td>${member.fullName}</td>

                    <td>
                        ${member.photoUrl ? `<img src="${member.photoUrl}" alt="Photo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);" />` : `<img src="images/default-user.jpg" alt="Default User" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);" />`}
                    </td>

                    <td>${member.bloodGroup}</td>

                    <td>${member.mobile}</td>

                    <td>
                        <span class="member-type-badge ${member.memberType === 'active-member' ? 'badge-active' : 'badge-member'
                }">${getMemberTypeTamil(member.memberType)}</span>
                    </td>

                    <td>
                        <button
                            class="download-id-card"
                            data-id="${member.id}"
                            data-membernumber="${member.memberNumber || ''}"
                            title="உறுப்பினர் அடையாள அட்டை பதிவிறக்கம்"
                        >
                            ⬇ அட்டை
                        </button>
                    </td>

                    <td>
                        <button
                            class="view-member"
                            data-id="${member.id}"
                            style="background-color: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                        >
                            பார்
                        </button>
                        <button
                            class="remove-member"
                            data-id="${member.id}"
                            data-photo="${member.photoUrl || ""}"
                        >
                            நீக்கு
                        </button>
                    </td>

                </tr>
            `

        ).join("");

    bindMemberButtons();
    bindDownloadIdCardButtons();
}

function bindMemberButtons() {
    document.querySelectorAll(".view-member").forEach(button => {
        button.addEventListener("click", async () => {
            const memberId = button.dataset.id;
            try {
                if (dashboardLoader) dashboardLoader.style.display = "block";
                const member = await getDocument(COLLECTIONS.MEMBERS, memberId);
                if (member) {
                    showDetailModal("உறுப்பினர் விவரங்கள் (Member Details)", [
                        { label: "உறுப்பினர் எண் (Member ID)", value: member.memberNumber },
                        { label: "முழு பெயர் (Full Name)", value: member.fullName },
                        { label: "தந்தை பெயர் (Father's Name)", value: member.fatherName || "-" },
                        { label: "புகைப்படம் (Photo)", value: member.photoUrl, isImage: true },
                        { label: "மின்னஞ்சல் (Email)", value: member.email },
                        { label: "கைபேசி எண் (Mobile)", value: member.mobile },
                        { label: "பாலினம் (Gender)", value: member.gender === "male" ? "ஆண் (Male)" : member.gender === "female" ? "பெண் (Female)" : "மற்றவை (Other)" },
                        { label: "பிறந்த தேதி (DOB)", value: member.dob },
                        { label: "இரத்த வகை (Blood Group)", value: member.bloodGroup },
                        { label: "தொழில் (Occupation)", value: member.occupation || "-" },
                        { label: "முகவரி (Address)", value: member.address },
                        { label: "ஏன் இணைய விரும்புகிறார் (Reason to Join)", value: member.whyJoin || "-" },
                        { label: "உறுப்பினர் வகை (Member Type)", value: getMemberTypeTamil(member.memberType) },
                        { label: "நிலை (Status)", value: getMemberStatusTamil(member.status) }
                    ]);
                }
            } catch (err) {
                console.error(err);
                showError("விவரங்களை ஏற்ற முடியவில்லை");
            } finally {
                if (dashboardLoader) dashboardLoader.style.display = "none";
            }
        });
    });

    document
        .querySelectorAll(
            ".remove-member"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    try {

                        const confirmed =

                            confirm(

                                "இந்த உறுப்பினரை நீக்க வேண்டுமா? இந்த செயல் திரும்ப பெற முடியாது."

                            );

                        if (!confirmed) {
                            return;
                        }

                        if (dashboardLoader) dashboardLoader.style.display = "block";

                        const memberId = button.dataset.id;
                        const photoUrl = button.dataset.photo;

                        // 1. Delete member photo from Supabase Storage
                        try {
                            if (photoUrl) {
                                const photoPath = getPathFromUrl(photoUrl);
                                if (photoPath) {
                                    await deleteFile(photoPath);
                                } else {
                                    await deleteFile(`memberPhotos/${memberId}`);
                                }
                            } else {
                                await deleteFile(`memberPhotos/${memberId}`);
                            }
                        } catch (storageError) {
                            console.warn("Storage deletion warning for member photo:", storageError);
                        }

                        // 2. Delete the Firestore member document entirely
                        await deleteDocument(COLLECTIONS.MEMBERS, memberId);

                        showSuccess(
                            "உறுப்பினர் நீக்கப்பட்டார்"
                        );

                    }

                    catch (error) {

                        console.error(error);

                        showError(
                            "உறுப்பினரை நீக்க முடியவில்லை"
                        );

                    } finally {
                        if (dashboardLoader) dashboardLoader.style.display = "none";
                    }

                    await fetchAllDashboardData();
                    await loadApprovedMembers();
                    await loadStatistics();

                }
            );

        });

}

// ========================================
// DOWNLOAD ID CARD
// ========================================

function bindDownloadIdCardButtons() {
    document.querySelectorAll(".download-id-card").forEach(button => {
        button.addEventListener("click", () => {
            const memberId = button.dataset.id;
            if (!memberId) return;
            const url = `id-card-template.html?memberId=${encodeURIComponent(memberId)}`;
            const win = window.open(url, "_blank", "width=900,height=700,scrollbars=yes");
            if (!win) {
                showError("பதிவிறக்கம் திறக்க முடியவில்லை. Pop-up அனுமதிக்கவும்.");
            }
        });
    });
}

function getPathFromUrl(url) {
    if (!url) return null;
    const marker = "/public/";
    const index = url.indexOf(marker);
    if (index === -1) return null;
    const rest = url.substring(index + marker.length);
    const firstSlash = rest.indexOf("/");
    if (firstSlash === -1) return null;
    const path = rest.substring(firstSlash + 1);
    return decodeURIComponent(path.split("?")[0]);
}

// ========================================
// EVENTS
// ========================================

async function loadEvents() {
    const events = dashboardState.events;

    if (!eventsTableBody) {
        return;
    }

    if (events.length === 0) {
        eventsTableBody.innerHTML =

            `
            <tr>

                <td colspan="6">

                    நிகழ்வுகள் இல்லை

                </td>

            </tr>
        `;

        return;
    }

    eventsTableBody.innerHTML =

        events.map(

            event =>

                `
                <tr>

                    <td>
                        ${event.imageUrl ? `<img src="${event.imageUrl}" alt="Event Image" style="width: 80px; height: 50px; border-radius: 4px; object-fit: cover; border: 1px solid var(--border-color);" />` : `<span style="color: var(--text-light); font-style: italic;">படம் இல்லை</span>`}
                    </td>

                    <td>${event.title}</td>

                    <td>${formatDate(event.date)}</td>

                    <td>${event.location || "-"}</td>

                    <td>${event.status || "-"}</td>

                    <td>
    <button
        class="delete-event"
        data-id="${event.id}"
        data-image="${event.imageUrl || ""}"
        data-title="${event.title}"
    >
        நீக்கு
    </button>
</td>

                </tr>
            `

        ).join("");

    bindEventButtons();
}

function bindEventButtons() {

    document
        .querySelectorAll(
            ".delete-event"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    try {

                        const imageUrl = button.dataset.image;
                        const eventTitle = button.dataset.title;

                        if (imageUrl) {
                            const imagePath = getPathFromUrl(imageUrl);
                            if (imagePath) {
                                try {
                                    await deleteFile(imagePath);
                                } catch (storageError) {
                                    console.warn("Storage deletion warning for event image:", storageError);
                                }
                            }
                        }

                        if (eventTitle) {
                            try {
                                const registrations = await queryByField(
                                    COLLECTIONS.EVENT_REGISTRATIONS,
                                    "eventName",
                                    "==",
                                    eventTitle
                                );
                                for (const reg of registrations) {
                                    await deleteDocument(COLLECTIONS.EVENT_REGISTRATIONS, reg.id);
                                }
                            } catch (regDeleteError) {
                                console.warn("Failed to cascade delete registrations for event:", regDeleteError);
                            }
                        }

                        await deleteDocument(
                            COLLECTIONS.EVENTS,
                            button.dataset.id
                        );

                        showSuccess(
                            "நிகழ்வு மற்றும் அதன் பதிவுகள் நீக்கப்பட்டன"
                        );
                    }

                    catch (error) {

                        showError(
                            "நிகழ்வை நீக்க முடியவில்லை"
                        );

                    }

                    await fetchAllDashboardData();
                    await loadEvents();
                    await loadStatistics();

                }
            );

        });

}

// ========================================
// CREATE EVENT MODAL AND HANDLING
// ========================================
const addEventModal = document.getElementById("addEventModal");
const addEventForm = document.getElementById("addEventForm");
const cancelEventBtn = document.getElementById("cancelEventBtn");
const closeModal = addEventModal?.querySelector(".close-modal");
const eventPhotoInput = document.getElementById("eventPhoto");

const closeAddEventModal = () => {
    if (addEventModal) {
        addEventModal.classList.remove("show");
        addEventModal.style.display = "none";
    }
    if (addEventForm) {
        addEventForm.reset();
    }
    const previewContainer = document.getElementById("eventPhotoPreviewContainer");
    if (previewContainer) {
        previewContainer.style.display = "none";
    }
};

if (createEventBtn) {
    createEventBtn.addEventListener("click", () => {
        if (addEventModal) {
            addEventModal.classList.add("show");
            addEventModal.style.display = "flex";
        }
    });
}

if (cancelEventBtn) cancelEventBtn.addEventListener("click", closeAddEventModal);
if (closeModal) closeModal.addEventListener("click", closeAddEventModal);

if (eventPhotoInput) {
    eventPhotoInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById("eventPhotoPreview");
                const previewContainer = document.getElementById("eventPhotoPreviewContainer");
                if (preview && previewContainer) {
                    preview.src = event.target.result;
                    previewContainer.style.display = "block";
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

if (addEventForm) {
    addEventForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("eventTitle")?.value.trim();
        const date = document.getElementById("eventDate")?.value;
        const location = document.getElementById("eventLocation")?.value.trim();
        const description = document.getElementById("eventDescription")?.value.trim();
        const photoFile = document.getElementById("eventPhoto")?.files?.[0];

        if (!title || !date || !location || !photoFile) {
            showError("அனைத்து விவரங்களையும் புகைப்படத்தையும் வழங்கவும்");
            return;
        }

        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";

            try {
                const existingPopups = await queryByField(COLLECTIONS.EVENTS, "popup", "==", true);
                for (const oldPopup of existingPopups) {
                    await updateDocument(COLLECTIONS.EVENTS, oldPopup.id, { popup: false });
                }
            } catch (popupErr) {
                console.warn("Failed to reset existing popups:", popupErr);
            }

            const eventId = await createDocument(
                COLLECTIONS.EVENTS,
                {
                    title,
                    date,
                    location,
                    description: description || "",
                    status: EVENT_STATUS.UPCOMING,
                    popup: true,
                    createdAt: serverTimestamp()
                }
            );

            // Upload photo to Supabase bucket
            const imageUrl = await uploadEventImage(eventId, photoFile);
            await updateDocument(COLLECTIONS.EVENTS, eventId, { imageUrl });

            showSuccess("நிகழ்வு வெற்றிகரமாக உருவாக்கப்பட்டது");
            closeAddEventModal();
            await fetchAllDashboardData();
            await loadEvents();
            await loadStatistics();
        } catch (error) {
            console.error("Error creating event:", error);
            showError("நிகழ்வை உருவாக்க முடியவில்லை");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

// ========================================
//DONATIONS TABLE
// ========================================

async function loadDonations() {

    if (!donationsTableBody) {
        return;
    }

    const donations = dashboardState.donations;

    donations.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    donationsTableBody.innerHTML =
        donations.map(donation => `
            <tr>
                <td>${donation.fullName}</td>
                <td>${donation.mobile}</td>
                <td>₹${donation.amount}</td>
                <td>${formatDate(donation.createdAt)}</td>
            </tr>
        `).join("");
}

// ========================================
//EVENT REGISTRATIONS TABLE
// ========================================

async function loadEventRegistrations() {

    if (!eventRegistrationsTableBody) {
        return;
    }

    const registrations = dashboardState.eventRegistrations;

    eventRegistrationsTableBody.innerHTML =
        registrations.map(reg => `
            <tr>
                <td>${reg.fullName}</td>
                <td>${reg.mobile}</td>
                <td>${reg.email}</td>
                <td>${reg.eventName}</td>
                <td>
                    <button
                        class="view-registration"
                        data-id="${reg.id}"
                        style="background-color: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                    >
                        பார்
                    </button>
                    <button
                        class="delete-registration"
                        data-id="${reg.id}"
                        style="background-color: #ff4d4d; color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer; margin-left: 5px;"
                    >
                        நீக்கு
                    </button>
                </td>
            </tr>
        `).join("");

    bindRegistrationButtons();
}

function bindRegistrationButtons() {
    document.querySelectorAll(".view-registration").forEach(button => {
        button.addEventListener("click", async () => {
            const regId = button.dataset.id;
            try {
                if (dashboardLoader) dashboardLoader.style.display = "block";
                const reg = await getDocument(COLLECTIONS.EVENT_REGISTRATIONS, regId);
                if (reg) {
                    showDetailModal("நிகழ்வு பதிவு விவரங்கள் (Event Registration Details)", [
                        { label: "பெயர் (Name)", value: reg.fullName },
                        { label: "கைபேசி எண் (Mobile)", value: reg.mobile },
                        { label: "மின்னஞ்சல் (Email)", value: reg.email },
                        { label: "உறுப்பினர் எண் (Member ID)", value: reg.memberId || "-" },
                        { label: "முகவரி (Address)", value: reg.address || "-" },
                        { label: "நிகழ்வு பெயர் (Event)", value: reg.eventName },
                        { label: "பதிவு செய்யப்பட்ட நேரம் (Registered At)", value: reg.createdAt ? formatDateTime(reg.createdAt) : "-" }
                    ]);
                }
            } catch (err) {
                console.error(err);
                showError("விவரங்களை ஏற்ற முடியவில்லை");
            } finally {
                if (dashboardLoader) dashboardLoader.style.display = "none";
            }
        });
    });

    document.querySelectorAll(".delete-registration").forEach(button => {
        button.addEventListener("click", async () => {
            if (confirm("இந்த நிகழ்வு பதிவை நீக்க வேண்டுமா?")) {
                const regId = button.dataset.id;
                try {
                    if (dashboardLoader) dashboardLoader.style.display = "block";
                    await deleteDocument(COLLECTIONS.EVENT_REGISTRATIONS, regId);
                    showSuccess("பதிவு நீக்கப்பட்டது");
                    await fetchAllDashboardData();
                    await loadEventRegistrations();
                    await loadStatistics();
                } catch (error) {
                    console.error(error);
                    showError("நீக்க முடியவில்லை");
                } finally {
                    if (dashboardLoader) dashboardLoader.style.display = "none";
                }
            }
        });
    });
}

// ========================================
// BLOOD DONORS
// ========================================

async function loadBloodDonors() {
    if (!bloodDonorsTableBody) {
        return;
    }

    const donors = dashboardState.bloodDonors;

    bloodDonorsTableBody.innerHTML =

        donors.map(

            donor =>

                `
                <tr>

                    <td>${donor.fullName}</td>

                    <td>${donor.bloodGroup}</td>

                    <td>${donor.mobile}</td>

                    <td>${donor.district}</td>

<td>
    <button
        class="view-donor"
        data-id="${donor.id}"
        style="background-color: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
    >
        பார்
    </button>
    <button
        class="delete-donor"
        data-id="${donor.id}"
    >
        நீக்கு
    </button>
</td>

                </tr>
            `

        ).join("");

    bindDonorButtons();

}

function bindDonorButtons() {
    document.querySelectorAll(".view-donor").forEach(button => {
        button.addEventListener("click", async () => {
            const donorId = button.dataset.id;
            try {
                if (dashboardLoader) dashboardLoader.style.display = "block";
                const donor = await getDocument(COLLECTIONS.BLOOD_DONORS, donorId);
                if (donor) {
                    showDetailModal("இரத்த தானதாரர் விவரங்கள் (Blood Donor Details)", [
                        { label: "பெயர் (Name)", value: donor.fullName },
                        { label: "வயது (Age)", value: donor.age || "-" },
                        { label: "இரத்த வகை (Blood Group)", value: donor.bloodGroup },
                        { label: "கைபேசி எண் (Mobile)", value: donor.mobile },
                        { label: "மின்னஞ்சல் (Email)", value: donor.email || "-" },
                        { label: "பாலினம் (Gender)", value: donor.gender === "male" ? "ஆண் (Male)" : donor.gender === "female" ? "பெண் (Female)" : donor.gender === "other" ? "மற்றவை (Other)" : (donor.gender || "-") },
                        { label: "முகவரி (Address)", value: donor.address || "-" },
                        { label: "மாவட்டம் (District)", value: donor.district || "-" },
                        { label: "இதற்கு முன்பு இரத்த தானம் செய்துள்ளாரா (Previously Donated)", value: donor.previousDonation === "yes" ? "ஆம் (Yes)" : (donor.previousDonation === "no" ? "இல்லை (No)" : (donor.previousDonation || "-")), },
                        { label: "கடைசியாக இரத்த தானம் செய்த தேதி (Last Donated)", value: donor.lastDonationDate || "-" },
                        { label: "அவசரகால உதவிக்கு சம்மதமா (Emergency Permission)", value: donor.emergencyPermission === "yes" ? "ஆம் (Yes)" : (donor.emergencyPermission === "no" ? "இல்லை (No)" : (donor.emergencyPermission || "-")) }
                    ]);
                }
            } catch (err) {
                console.error(err);
                showError("விவரங்களை ஏற்ற முடியவில்லை");
            } finally {
                if (dashboardLoader) dashboardLoader.style.display = "none";
            }
        });
    });

    document
        .querySelectorAll(".delete-donor")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    try {

                        await deleteDocument(
                            COLLECTIONS.BLOOD_DONORS,
                            button.dataset.id
                        );

                        showSuccess(
                            "தானதாரர் நீக்கப்பட்டார்"
                        );

                        await fetchAllDashboardData();
                        await loadBloodDonors();
                        await loadStatistics();

                    }
                    catch (error) {

                        console.error(error);

                        showError(
                            "நீக்க முடியவில்லை"
                        );

                    }

                }
            );

        });

}

// ========================================
//PAYMENT SETTINGS
// ========================================

if (savePaymentSettingsBtn) {

    savePaymentSettingsBtn.addEventListener(

        "click",

        async () => {

            try {

                let qrUrl = "";

                const file =
                    qrUpload?.files?.[0];

                const paymentDoc = await getDocument(COLLECTIONS.SETTINGS, "payment");

                if (file) {
                    if (paymentDoc?.qrUrl) {
                        const oldPath = getPathFromUrl(paymentDoc.qrUrl);
                        if (oldPath) {
                            try {
                                await deleteFile(oldPath);
                            } catch (storageError) {
                                console.warn("Storage deletion warning for old QR code:", storageError);
                            }
                        }
                    }

                    qrUrl =
                        await uploadQrCode(
                            file
                        );

                }

                const finalQrUrl = qrUrl || paymentDoc?.qrUrl || "";

                await setDocument(

                    COLLECTIONS.SETTINGS,

                    "payment",

                    {
                        upiId:
                            upiInput
                                ? upiInput.value.trim()
                                : "",
                        qrUrl: finalQrUrl
                    }

                );

                const currentQrPreview = document.getElementById("currentQrPreview");
                if (currentQrPreview && finalQrUrl) {
                    currentQrPreview.src = finalQrUrl;
                    currentQrPreview.style.display = "block";
                }


                showSuccess(
                    "கட்டண அமைப்புகள் சேமிக்கப்பட்டன"
                );

            }
            catch (error) {

                console.error(error);

                showError(
                    "சேமிக்க முடியவில்லை"
                );

            }

        }

    );

}

// ========================================
//HOMEPAGE STATS SAVE
// ========================================

if (saveHomepageStatsBtn) {

    saveHomepageStatsBtn.addEventListener(

        "click",

        async () => {

            try {

                const familiesInput =
                    document.getElementById(
                        "familiesCount"
                    );

                const studentsInput =
                    document.getElementById(
                        "studentsCount"
                    );

                const issuesSolvedInput =
                    document.getElementById(
                        "issuesSolvedCount"
                    );

                const eventsInput =
                    document.getElementById(
                        "eventsCount"
                    );

                if (
                    !familiesInput ||
                    !studentsInput ||
                    !issuesSolvedInput ||
                    !eventsInput
                ) {

                    showError(
                        "புள்ளிவிவர புலங்கள் காணப்படவில்லை"
                    );

                    return;
                }

                await setDocument(

                    COLLECTIONS.SETTINGS,

                    "homepage",

                    {

                        families:
                            Number(
                                familiesInput.value
                            ),

                        students:
                            Number(
                                studentsInput.value
                            ),

                        issuesSolved:
                            Number(
                                issuesSolvedInput.value
                            ),

                        events:
                            Number(
                                eventsInput.value
                            )

                    }

                );


                showSuccess(
                    "புள்ளிவிவரங்கள் சேமிக்கப்பட்டன"
                );

            }
            catch (error) {

                console.error(error);

                showError(
                    "சேமிக்க முடியவில்லை"
                );

            }

        }

    );

}

// ========================================
//ANNOUNCEMENTS
// ========================================

if (
    publishAnnouncementBtn &&
    announcementText
) {

    publishAnnouncementBtn.addEventListener(

        "click",

        async () => {

            try {

                const text =
                    announcementText.value.trim();

                if (!text) {
                    return;
                }

                await createDocument(

                    COLLECTIONS.ANNOUNCEMENTS,

                    {
                        text,
                        createdAt:
                            new Date()
                    }

                );

                showSuccess(
                    "அறிவிப்பு வெளியிடப்பட்டது"
                );

                announcementText.value =
                    "";

                await fetchAllDashboardData();
                await loadAnnouncements();

            }
            catch (error) {

                console.error(error);

                showError(
                    "அறிவிப்பு வெளியிட முடியவில்லை"
                );

            }

        }

    );

}

async function loadAnnouncements() {
    if (!announcementsTableBody) {
        return;
    }
    try {
        const announcements = dashboardState.announcements;
        announcements.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        if (announcements.length === 0) {
            announcementsTableBody.innerHTML = `<tr><td colspan="2">அறிவிப்புகள் இல்லை</td></tr>`;
            return;
        }

        announcementsTableBody.innerHTML = announcements.map(item => `
            <tr>
                <td>${item.text}</td>
                <td>
                    <button class="delete-announcement" data-id="${item.id}" style="background-color: #ff4d4d; color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;">நீக்கு</button>
                </td>
            </tr>
        `).join("");

        bindAnnouncementButtons();
    } catch (error) {
        console.error("Error loading announcements:", error);
    }
}

function bindAnnouncementButtons() {
    document.querySelectorAll(".delete-announcement").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (confirm("இந்த அறிவிப்பை நீக்க வேண்டுமா?")) {
                try {
                    await deleteDocument(COLLECTIONS.ANNOUNCEMENTS, btn.dataset.id);
                    showSuccess("அறிவிப்பு நீக்கப்பட்டது");
                    await fetchAllDashboardData();
                    await loadAnnouncements();
                } catch (error) {
                    console.error(error);
                    showError("நீக்க முடியவில்லை");
                }
            }
        });
    });
}

// ========================================
//ADD YT LINK
// ========================================

if (
    addYoutubeBtn &&
    youtubeLinkInput
) {

    addYoutubeBtn.addEventListener(

        "click",

        async () => {

            try {

                const url =
                    youtubeLinkInput.value.trim();

                if (!url) {
                    return;
                }

                if (

                    !url.includes(
                        "youtube.com"
                    ) &&

                    !url.includes(
                        "youtu.be"
                    )

                ) {

                    showError(
                        "சரியான YouTube இணைப்பை உள்ளிடவும்"
                    );

                    return;
                }

                await createDocument(

                    COLLECTIONS.VIDEOS,

                    {
                        url,
                        createdAt:
                            new Date()
                    }

                );

                showSuccess(
                    "வீடியோ சேர்க்கப்பட்டது"
                );

                youtubeLinkInput.value =
                    "";

                await fetchAllDashboardData();
                await loadVideoPreviews();

            }
            catch (error) {

                console.error(error);

                showError(
                    "வீடியோ சேர்க்க முடியவில்லை"
                );

            }

        }

    );

}

// ========================================
//UPLOAD GALLERY
// ========================================

if (
    uploadGalleryBtn &&
    galleryUploadInput
) {

    uploadGalleryBtn.addEventListener(

        "click",

        async () => {

            try {

                const files =
                    galleryUploadInput.files;

                if (!files.length) {
                    return;
                }

                for (
                    const file
                    of files
                ) {

                    const imageUrl =
                        await uploadGalleryImage(
                            file
                        );

                    await createDocument(

                        COLLECTIONS.GALLERY,

                        {
                            imageUrl,
                            createdAt:
                                new Date()
                        }

                    );

                }

                showSuccess(
                    "புகைப்படங்கள் பதிவேற்றப்பட்டன"
                );

                galleryUploadInput.value =
                    "";

                await fetchAllDashboardData();
                await loadGalleryPreviews();
                await loadStatistics();


            }
            catch (error) {

                console.error(error);

                showError(
                    "பதிவேற்ற முடியவில்லை"
                );

            }

        }

    );

}

// ========================================
// BLOOD REQUESTS
// ========================================

async function loadBloodRequests() {
    if (!bloodRequestsTableBody) {
        return;
    }

    const requests = dashboardState.bloodRequests;

    requests.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    bloodRequestsTableBody.innerHTML =

        requests.map(

            request =>

                `
                <tr>

                    <td>${request.patientName}</td>

                    <td>${request.bloodGroup}</td>

                    <td>${request.hospitalName}</td>

                    <td>
                        <button
                            class="view-request"
                            data-id="${request.id}"
                            style="background-color: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                        >
                            பார்
                        </button>
                        <button
                            class="delete-request"
                            data-id="${request.id}"
                            style="background-color: #ff4d4d; color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                        >
                            நீக்கு
                        </button>
                    </td>

                </tr>
            `

        ).join("");

    bindRequestButtons();

}

function bindRequestButtons() {
    document.querySelectorAll(".view-request").forEach(button => {
        button.addEventListener("click", async () => {
            const requestId = button.dataset.id;
            try {
                if (dashboardLoader) dashboardLoader.style.display = "block";
                const req = await getDocument(COLLECTIONS.BLOOD_REQUESTS, requestId);
                if (req) {
                    showDetailModal("இரத்தக் கோரிக்கை விவரங்கள் (Blood Request Details)", [
                        { label: "நோயாளர் பெயர் (Patient Name)", value: req.patientName },
                        { label: "வயது (Age)", value: req.age || "-" },
                        { label: "பாலினம் (Gender)", value: req.gender === "male" ? "ஆண் (Male)" : req.gender === "female" ? "பெண் (Female)" : req.gender === "other" ? "மற்றவை (Other)" : (req.gender || "-") },
                        { label: "இரத்த வகை (Blood Group)", value: req.bloodGroup },
                        { label: "தேவைப்படும் யூனிட் அளவு (Units Needed)", value: req.unitsRequired || "-" },
                        { label: "மருத்துவமனை பெயர் (Hospital Name)", value: req.hospitalName },
                        { label: "மருத்துவமனை முகவரி (Hospital Address)", value: req.hospitalAddress || "-" },
                        { label: "மாவட்டம் (District)", value: req.district || "-" },
                        { label: "முன்னுரிமை (Priority)", value: req.priority === "urgent" ? "அவசரம் (Urgent)" : (req.priority === "normal" ? "சாதாரணமானது (Normal)" : (req.priority || "-")) },
                        { label: "தொடர்பு கொள்ள வேண்டிய நபர் (Contact Person)", value: req.contactPerson || "-" },
                        { label: "தொடர்பு எண் (Contact Number)", value: req.mobile || "-" },
                        { label: "மின்னஞ்சல் (Email)", value: req.email || "-" },
                        { label: "கூடுதல் விவரங்கள் (Additional Notes)", value: req.additionalNotes || "-" },
                        { label: "கோரிக்கை நிலை (Status)", value: getBloodStatusTamil(req.status) },
                        { label: "பதிவு செய்யப்பட்ட நேரம் (Requested At)", value: req.createdAt ? formatDate(req.createdAt) : "-" }
                    ]);
                }
            } catch (err) {
                console.error(err);
                showError("விவரங்களை ஏற்ற முடியவில்லை");
            } finally {
                if (dashboardLoader) dashboardLoader.style.display = "none";
            }
        });
    });

    document
        .querySelectorAll(
            ".delete-request"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    if (confirm("இந்த இரத்த கோரிக்கையை நீக்க வேண்டுமா?")) {
                        try {

                            await deleteDocument(
                                COLLECTIONS.BLOOD_REQUESTS,
                                button.dataset.id
                            );

                            showSuccess(
                                "கோரிக்கை நீக்கப்பட்டது"
                            );

                            await loadBloodRequests();
                            await loadStatistics();

                        }
                        catch (error) {

                            console.error(error);

                            showError(
                                "கோரிக்கையை நீக்க முடியவில்லை"
                            );

                        }
                    }

                }
            );

        });

}

// ========================================
// PROBLEMS
// ========================================

function parseUserAgent(ua) {
    if (!ua) return { browser: "-", os: "-" };
    let browser = "Other";
    let os = "Other";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Linux")) os = "Linux";

    if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome") && !ua.includes("Chromium")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

    return { browser, os };
}

async function loadProblems() {
    if (!problemReportsTableBody) {
        return;
    }

    const problems = dashboardState.problems;

    problems.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    problemReportsTableBody.innerHTML =

        problems.map(

            problem =>

                `
                <tr>

                    <td>${escapeHtml(problem.problemNumber || "-")}</td>
                    <td>${escapeHtml(problem.reporterName)}</td>
                    <td>${escapeHtml(problem.problemCategory)}</td>
                    <td>${escapeHtml(problem.problemLocation)}</td>

                    <td>
                        <button class="view-problem-btn"
                            data-number="${escapeHtml(problem.problemNumber || '-')}"
                            data-name="${escapeHtml(problem.reporterName)}"
                            data-mobile="${escapeHtml(problem.reporterMobile)}"
                            data-location="${escapeHtml(problem.problemLocation || '-')}"
                            data-category="${escapeHtml(problem.problemCategory)}"
                            data-desc="${escapeHtml(problem.problemDescription || '')}"
                            style="background-color: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                        >பார்</button>
                        <button class="delete-problem-btn"
                            data-id="${problem.id}"
                            style="background-color: #ff4d4d; color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                        >நீக்கு</button>
                    </td>

                </tr>
            `

        ).join("");

    bindProblemButtons();
}

function bindProblemButtons() {
    document.querySelectorAll(".view-problem-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const data = btn.dataset;
            showDetailModal("பொதுமக்கள் பிரச்சினை விவரங்கள் (Grievance Details)", [
                { label: "டிராக்கிங் எண் (Tracking No)", value: data.number },
                { label: "பெயர் (Reporter Name)", value: data.name },
                { label: "கைபேசி எண் (Mobile)", value: data.mobile },
                { label: "இடம் (Location)", value: data.location },
                { label: "பிரச்சினை வகை (Category)", value: data.category },
                { label: "விளக்கம் (Description)", value: data.desc }
            ]);
        });
    });

    document.querySelectorAll(".delete-problem-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (confirm("இந்த பிரச்சினை பதிவை நீக்க வேண்டுமா?")) {
                try {
                    await deleteDocument(COLLECTIONS.GRIEVANCES, btn.dataset.id);
                    showSuccess("பிரச்சினை பதிவு நீக்கப்பட்டது");
                    await fetchAllDashboardData();
                    await loadProblems();
                    await loadStatistics();
                } catch (error) {
                    console.error(error);
                    showError("நீக்க முடியவில்லை");
                }
            }
        });
    });
}

// ========================================
// CONTACT
// ========================================

async function loadContactMessages() {
    if (!contactMessagesTableBody) {
        return;
    }

    const messages = dashboardState.contactMessages;

    messages.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    contactMessagesTableBody.innerHTML =

        messages.map(

            message =>

                `
                <tr>

                    <td>${escapeHtml(message.feedbackName)}</td>
                    <td>${escapeHtml(message.feedbackEmail || '-')}</td>
                    <td>${escapeHtml(message.feedbackType)}</td>
                    <td>${formatDate(message.createdAt)}</td>

                    <td>
                        <button class="view-message-btn"
                            data-name="${escapeHtml(message.feedbackName)}"
                            data-mobile="${escapeHtml(message.feedbackMobile || '-')}"
                            data-email="${escapeHtml(message.feedbackEmail || '-')}"
                            data-type="${escapeHtml(message.feedbackType)}"
                            data-msg="${escapeHtml(message.feedbackMessage || '')}"
                            style="background-color: var(--primary); color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                        >பார்</button>
                        <button class="delete-message-btn"
                            data-id="${message.id}"
                            style="background-color: #ff4d4d; color: white; border: none; padding: 4px 8px; border-radius: var(--radius-sm); cursor: pointer;"
                        >நீக்கு</button>
                    </td>

                </tr>
            `

        ).join("");

    bindMessageButtons();
}

function bindMessageButtons() {
    document.querySelectorAll(".view-message-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const data = btn.dataset;
            showDetailModal("தொடர்பு செய்தி விவரங்கள் (Contact Message Details)", [
                { label: "பெயர் (Name)", value: data.name },
                { label: "கைபேசி எண் (Mobile)", value: data.mobile },
                { label: "மின்னஞ்சல் (Email)", value: data.email },
                { label: "பொருள் / வகை (Subject/Type)", value: data.type },
                { label: "செய்தி (Message)", value: data.msg }
            ]);
        });
    });

    document.querySelectorAll(".delete-message-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (confirm("இந்த தொடர்பு செய்தியை நீக்க வேண்டுமா?")) {
                try {
                    await deleteDocument(COLLECTIONS.CONTACT_MESSAGES, btn.dataset.id);
                    showSuccess("செய்தி நீக்கப்பட்டது");
                    await fetchAllDashboardData();
                    await loadContactMessages();
                    await loadStatistics();
                } catch (error) {
                    console.error(error);
                    showError("நீக்க முடியவில்லை");
                }
            }
        });
    });
}

// ========================================
// DETAIL MODAL HELPERS
// ========================================

function showDetailModal(title, rows) {
    const modal = document.getElementById("detailModal");
    const modalTitle = document.getElementById("detailModalTitle");
    const modalBody = document.getElementById("detailModalBody");

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = rows.map(row => {
        if (row.isImage) {
            return `
                <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                    <div class="detail-label" style="width: 100%; margin-bottom: 5px;">${escapeHtml(row.label)}</div>
                    <div class="detail-value" style="width: 100%; text-align: left;">
                        ${row.value ? `<img src="${row.value}" class="detail-img" alt="${escapeHtml(row.label)}" />` : '<span style="color: var(--text-light); font-style: italic;">படம் இல்லை (No Image)</span>'}
                    </div>
                </div>
            `;
        }
        if (row.isLink) {
            return `
                <div class="detail-row">
                    <div class="detail-label">${escapeHtml(row.label)}</div>
                    <div class="detail-value">
                        ${row.value ? `<a href="${row.value}" target="_blank" rel="noopener noreferrer">பார் (View Link)</a>` : '<span style="color: var(--text-light); font-style: italic;">இணைப்பு இல்லை (No Link)</span>'}
                    </div>
                </div>
            `;
        }
        return `
            <div class="detail-row">
                <div class="detail-label">${escapeHtml(row.label)}</div>
                <div class="detail-value">${escapeHtml(row.value ?? "-")}</div>
            </div>
        `;
    }).join("");

    modal.classList.add("show");
    modal.style.display = "flex";
}

const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
if (closeDetailModalBtn) {
    closeDetailModalBtn.addEventListener("click", () => {
        const modal = document.getElementById("detailModal");
        if (modal) {
            modal.classList.remove("show");
            modal.style.display = "none";
        }
    });
}

// ========================================
// HELPER
// ========================================

function setText(
    id,
    value
) {
    const element =

        document.getElementById(
            id
        );

    if (element) {
        element.textContent =
            value;
    }
}

// ========================================
// LOGOUT
// ========================================

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener(

        "click",

        async () => {

            try {

                await logout();

                location.href =
                    "admin-login.html";

            }
            catch (error) {

                console.error(error);

                showError(
                    "வெளியேற முடியவில்லை"
                );

            }

        }

    );
}

// ========================================
// EXCEL EXPORT
// ========================================

function exportToExcel(data, filename) {
    if (!data || data.length === 0) {
        showError("ஏற்றுமதி செய்ய தரவு இல்லை");
        return;
    }

    const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))));
    const rows = data.map(item =>
        headers.map(h => {
            const val = item[h];
            if (val && typeof val === 'object' && val.seconds !== undefined) {
                return new Date(val.seconds * 1000).toLocaleDateString("ta-IN");
            }
            if (val && val.toDate) return val.toDate().toLocaleDateString("ta-IN");
            return val ?? "";
        })
    );

    const csvContent = [headers, ...rows]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

const exportMembersBtn = document.getElementById("exportMembersBtn");
const exportEventRegistrationsBtn = document.getElementById("exportEventRegistrationsBtn");
const exportBloodDonorsBtn = document.getElementById("exportBloodDonorsBtn");
const exportBloodRequestsBtn = document.getElementById("exportBloodRequestsBtn");
const exportDonationsBtn = document.getElementById("exportDonationsBtn");
const exportProblemsBtn = document.getElementById("exportProblemsBtn");

if (exportMembersBtn) {
    exportMembersBtn.addEventListener("click", () => {
        const mappedData = dashboardState.members.map(member => ({
            "உறுப்பினர் எண் (Member ID)": member.memberNumber || "-",
            "முழு பெயர் (Full Name)": member.fullName || "-",
            "தந்தை பெயர் (Father Name)": member.fatherName || "-",
            "கைபேசி எண் (Mobile)": member.mobile || "-",
            "மின்னஞ்சல் (Email)": member.email || "-",
            "முகவரி (Address)": member.address || "-",
            "பிறந்த தேதி (DOB)": member.dob || "-",
            "தொழில் (Occupation)": member.occupation || "-",
            "பாலினம் (Gender)": member.gender === "male" ? "ஆண் (Male)" : member.gender === "female" ? "பெண் (Female)" : member.gender === "other" ? "மற்றவை (Other)" : (member.gender || "-"),
            "இரத்த வகை (Blood Group)": member.bloodGroup || "-",
            "ஏன் இணைய விரும்புகிறார் (Reason to Join)": member.whyJoin || "-",
            "உறுப்பினர் வகை (Member Type)": getMemberTypeTamil(member.memberType) || "-",
            "நிலை (Status)": getMemberStatusTamil(member.status) || "-",
            "விண்ணப்பித்த தேதி (Applied At)": member.createdAt ? (member.createdAt.toDate ? member.createdAt.toDate().toLocaleDateString("ta-IN") : new Date(member.createdAt).toLocaleDateString("ta-IN")) : "-"
        }));
        exportToExcel(mappedData, "உறுப்பினர்கள்");
    });
}

if (exportEventRegistrationsBtn) {
    exportEventRegistrationsBtn.addEventListener("click", () => {
        const mappedData = dashboardState.eventRegistrations.map(reg => ({
            "பெயர் (Name)": reg.fullName || "-",
            "கைபேசி எண் (Mobile)": reg.mobile || "-",
            "மின்னஞ்சல் (Email)": reg.email || "-",
            "உறுப்பினர் எண் (Member ID)": reg.memberId || "-",
            "முகவரி (Address)": reg.address || "-",
            "நிகழ்வு பெயர் (Event)": reg.eventName || "-",
            "பதிவு செய்யப்பட்ட தேதி (Registered At)": reg.createdAt ? (reg.createdAt.toDate ? reg.createdAt.toDate().toLocaleDateString("ta-IN") : new Date(reg.createdAt).toLocaleDateString("ta-IN")) : "-"
        }));
        exportToExcel(mappedData, "நிகழ்வு_பதிவுகள்");
    });
}

if (exportBloodDonorsBtn) {
    exportBloodDonorsBtn.addEventListener("click", () => {
        const mappedData = dashboardState.bloodDonors.map(donor => ({
            "பெயர் (Name)": donor.fullName || "-",
            "வயது (Age)": donor.age || "-",
            "பாலினம் (Gender)": donor.gender === "male" ? "ஆண் (Male)" : donor.gender === "female" ? "பெண் (Female)" : donor.gender === "other" ? "மற்றவை (Other)" : (donor.gender || "-"),
            "இரத்த வகை (Blood Group)": donor.bloodGroup || "-",
            "கைபேசி எண் (Mobile)": donor.mobile || "-",
            "மின்னஞ்சல் (Email)": donor.email || "-",
            "முகவரி (Address)": donor.address || "-",
            "மாவட்டம் (District)": donor.district || "-",
            "இதற்கு முன்பு இரத்த தானம் செய்துள்ளாரா (Previously Donated)": donor.previousDonation === "yes" ? "ஆம் (Yes)" : (donor.previousDonation === "no" ? "இல்லை (No)" : (donor.previousDonation || "-")),
            "கடைசியாக இரத்த தானம் செய்த தேதி (Last Donation Date)": donor.lastDonationDate || "-",
            "அவசரகால உதவிக்கு சம்மதமா (Emergency Permission)": donor.emergencyPermission === "yes" ? "ஆம் (Yes)" : (donor.emergencyPermission === "no" ? "இல்லை (No)" : (donor.emergencyPermission || "-")),
            "பதிவு செய்யப்பட்ட தேதி (Registered At)": donor.createdAt ? (donor.createdAt.toDate ? donor.createdAt.toDate().toLocaleDateString("ta-IN") : new Date(donor.createdAt).toLocaleDateString("ta-IN")) : "-"
        }));
        exportToExcel(mappedData, "இரத்த_தானதாரர்கள்");
    });
}

if (exportBloodRequestsBtn) {
    exportBloodRequestsBtn.addEventListener("click", () => {
        const mappedData = dashboardState.bloodRequests.map(req => ({
            "நோயாளர் பெயர் (Patient Name)": req.patientName || "-",
            "வயது (Age)": req.age || "-",
            "பாலினம் (Gender)": req.gender === "male" ? "ஆண் (Male)" : req.gender === "female" ? "பெண் (Female)" : req.gender === "other" ? "மற்றவை (Other)" : (req.gender || "-"),
            "இரத்த வகை (Blood Group)": req.bloodGroup || "-",
            "தேவைப்படும் யூனிட் அளவு (Units Required)": req.unitsRequired || "-",
            "மருத்துவமனை பெயர் (Hospital Name)": req.hospitalName || "-",
            "மருத்துவமனை முகவரி (Hospital Address)": req.hospitalAddress || "-",
            "மாவட்டம் (District)": req.district || "-",
            "முன்னுரிமை (Priority)": req.priority === "urgent" ? "அவசரம் (Urgent)" : (req.priority === "normal" ? "சாதாரணமானது (Normal)" : (req.priority || "-")),
            "தொடர்பு கொள்ள வேண்டிய நபர் (Contact Person)": req.contactPerson || "-",
            "கைபேசி எண் (Mobile)": req.mobile || "-",
            "மின்னஞ்சல் (Email)": req.email || "-",
            "கூடுதல் விவரங்கள் (Additional Notes)": req.additionalNotes || "-",
            "கோரிக்கை நிலை (Status)": getBloodStatusTamil(req.status) || "-",
            "பதிவு செய்யப்பட்ட தேதி (Requested At)": req.createdAt ? (req.createdAt.toDate ? req.createdAt.toDate().toLocaleDateString("ta-IN") : new Date(req.createdAt).toLocaleDateString("ta-IN")) : "-"
        }));
        exportToExcel(mappedData, "இரத்த_கோரிக்கைகள்");
    });
}

if (exportDonationsBtn) {
    exportDonationsBtn.addEventListener("click", () => {
        const mappedData = dashboardState.donations.map(donation => ({
            "பெயர் (Name)": donation.fullName || "-",
            "கைபேசி எண் (Mobile)": donation.mobile || "-",
            "தொகை (Amount)": donation.amount ? `₹${donation.amount}` : "-",
            "செய்தி (Message)": donation.message || "-",
            "நிலை (Status)": donation.paymentStatus || "-",
            "தேதி (Date)": donation.createdAt ? (donation.createdAt.toDate ? donation.createdAt.toDate().toLocaleDateString("ta-IN") : new Date(donation.createdAt).toLocaleDateString("ta-IN")) : "-"
        }));
        exportToExcel(mappedData, "நன்கொடைகள்");
    });
}

if (exportProblemsBtn) {
    exportProblemsBtn.addEventListener("click", () => {
        const mappedData = dashboardState.problems.map(prob => ({
            "டிராக்கிங் எண் (Tracking No)": prob.problemNumber || "-",
            "பெயர் (Reporter Name)": prob.reporterName || "-",
            "கைபேசி எண் (Mobile)": prob.reporterMobile || "-",
            "இடம் (Location)": prob.problemLocation || "-",
            "பிரச்சினை வகை (Category)": prob.problemCategory || "-",
            "விளக்கம் (Description)": prob.problemDescription || "-",
            "நிலை (Status)": prob.status || "-",
            "தேதி (Date)": prob.createdAt ? (prob.createdAt.toDate ? prob.createdAt.toDate().toLocaleDateString("ta-IN") : new Date(prob.createdAt).toLocaleDateString("ta-IN")) : "-"
        }));
        exportToExcel(mappedData, "பிரச்சினை_பதிவுகள்");
    });
}

// ========================================
// TESTIMONIALS
// ========================================

const addTestimonialBtn = document.getElementById("addTestimonialBtn");

if (addTestimonialBtn) {
    addTestimonialBtn.addEventListener("click", async () => {
        const name = prompt("கருத்து தெரிவிப்பவர் பெயர்");
        if (!name) return;

        const message = prompt("கருத்து");
        if (!message) return;

        try {
            await createDocument(
                COLLECTIONS.TESTIMONIALS,
                {
                    name,
                    message,
                    createdAt: serverTimestamp()
                }
            );

            showSuccess("கருத்து சேர்க்கப்பட்டது");
            await fetchAllDashboardData();
            await loadTestimonials();


        } catch (error) {
            console.error(error);
            showError("கருத்து சேர்க்க முடியவில்லை");
        }
    });
}

// ========================================
// MEMBER SEARCH
// ========================================

const memberSearchInput = document.getElementById("memberSearchInput");

if (memberSearchInput) {
    memberSearchInput.addEventListener("input", () => {
        const query = memberSearchInput.value.trim().toLowerCase();
        const rows = membersTableBody?.querySelectorAll("tr") || [];

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? "" : "none";
        });
    });
}

// ========================================
// BLOOD DONOR SEARCH
// ========================================

const bloodSearchInput = document.getElementById("bloodSearchInput");

if (bloodSearchInput) {
    bloodSearchInput.addEventListener("input", () => {
        const query = bloodSearchInput.value.trim().toLowerCase();
        const rows = bloodDonorsTableBody?.querySelectorAll("tr") || [];

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? "" : "none";
        });
    });
}

// ========================================
// ADDITIONAL FUNCTIONS FOR ADMIN DASHBOARD
// ========================================

async function loadTestimonials() {
    const testimonialsAdmin = document.getElementById("testimonialsAdmin");
    if (!testimonialsAdmin) return;

    try {
        const testimonials = dashboardState.testimonials;
        if (testimonials.length === 0) {
            testimonialsAdmin.innerHTML = `<p style="padding: 10px; color: #666; font-style: italic;">தற்போது கருத்துக்கள் எதுவும் இல்லை.</p>`;
            return;
        }

        testimonialsAdmin.innerHTML = testimonials.map(t => `
            <div class="testimonial-admin-card" style="border: 1px solid #ddd; padding: 12px; margin: 10px 0; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-light);">
                <div>
                    <strong>${t.name}</strong>
                    <p style="margin: 5px 0 0 0; color: #555; font-style: italic;">"${t.message}"</p>
                </div>
                <button class="delete-testimonial-btn" data-id="${t.id}" style="background-color: #ff4d4d; color: white; border: none; padding: 6px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.9rem;">நீக்கு</button>
            </div>
        `).join("");

        testimonialsAdmin.querySelectorAll(".delete-testimonial-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.getAttribute("data-id");
                if (confirm("இந்த கருத்தை நீக்க விரும்புகிறீர்களா?")) {
                    try {
                        await deleteDocument(COLLECTIONS.TESTIMONIALS, id);
                        showSuccess("கருத்து நீக்கப்பட்டது");
                        await fetchAllDashboardData();
                        await loadTestimonials();
                    } catch (error) {
                        console.error(error);
                        showError("கருத்து நீக்க முடியவில்லை");
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error loading testimonials in admin:", error);
    }
}

async function loadGalleryPreviews() {
    const galleryPreviewContainer = document.getElementById("galleryPreviewContainer");
    if (!galleryPreviewContainer) return;

    try {
        const gallery = dashboardState.gallery;
        if (gallery.length === 0) {
            galleryPreviewContainer.innerHTML = `<p style="padding: 10px; color: #666; font-style: italic;">புகைப்படங்கள் எதுவும் இல்லை.</p>`;
            return;
        }

        galleryPreviewContainer.innerHTML = gallery.map(item => `
            <div class="gallery-preview-item" style="display: inline-block; position: relative; margin: 8px; width: 100px; height: 100px;">
                <img src="${item.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid #ddd;" />
                <button class="delete-gallery-btn" data-id="${item.id}" data-image="${item.imageUrl}" style="position: absolute; top: -5px; right: -5px; background: #ff4d4d; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">&times;</button>
            </div>
        `).join("");

        galleryPreviewContainer.querySelectorAll(".delete-gallery-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                const imageUrl = btn.dataset.image;
                if (confirm("இந்த புகைப்படத்தை நீக்க விரும்புகிறீர்களா?")) {
                    try {
                        if (imageUrl) {
                            const imagePath = getPathFromUrl(imageUrl);
                            if (imagePath) {
                                try {
                                    await deleteFile(imagePath);
                                } catch (storageError) {
                                    console.warn("Storage deletion warning for gallery image:", storageError);
                                }
                            }
                        }
                        await deleteDocument(COLLECTIONS.GALLERY, id);
                        showSuccess("புகைப்படம் நீக்கப்பட்டது");
                        await fetchAllDashboardData();
                        await loadGalleryPreviews();
                        await loadStatistics();
                    } catch (error) {
                        console.error(error);
                        showError("நீக்க முடியவில்லை");
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error loading gallery preview:", error);
    }
}

async function loadPaymentSettings() {
    try {
        const paymentData = await getDocument(COLLECTIONS.SETTINGS, "payment");
        if (paymentData) {
            if (upiInput) {
                upiInput.value = paymentData.upiId || "";
            }
            const currentQrPreview = document.getElementById("currentQrPreview");
            if (currentQrPreview && paymentData.qrUrl) {
                currentQrPreview.src = paymentData.qrUrl;
                currentQrPreview.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error loading payment settings:", error);
    }
}

// ========================================
// LOAD HOMEPAGE STATS SETTINGS
// ========================================
async function loadHomepageStatsSettings() {
    try {
        const stats = await getDocument(COLLECTIONS.SETTINGS, "homepage");
        if (stats) {
            const familiesInput = document.getElementById("familiesCount");
            const studentsInput = document.getElementById("studentsCount");
            const issuesSolvedInput = document.getElementById("issuesSolvedCount");
            const eventsInput = document.getElementById("eventsCount");

            if (familiesInput) familiesInput.value = stats.families ?? "";
            if (studentsInput) studentsInput.value = stats.students ?? "";
            if (issuesSolvedInput) issuesSolvedInput.value = stats.issuesSolved ?? "";
            if (eventsInput) eventsInput.value = stats.events ?? "";
        }
    } catch (error) {
        console.error("Error loading homepage stats settings:", error);
    }
}

// ========================================
// VIDEO PREVIEWS
// ========================================
async function loadVideoPreviews() {
    const videoPreviewContainer = document.getElementById("videoPreviewContainer");
    if (!videoPreviewContainer) return;

    try {
        const videos = dashboardState.videos;
        if (videos.length === 0) {
            videoPreviewContainer.innerHTML = `<p style="padding: 10px; color: #666; font-style: italic;">வீடியோக்கள் எதுவும் இல்லை.</p>`;
            return;
        }

        videoPreviewContainer.innerHTML = videos.map(video => `
            <div class="video-preview-item" style="border: 1px solid #ddd; padding: 12px; margin: 8px 0; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-light);">
                <span style="word-break: break-all;">${video.url}</span>
                <button class="delete-video-btn" data-id="${video.id}" style="background-color: #ff4d4d; color: white; border: none; padding: 6px 12px; border-radius: var(--radius-sm); cursor: pointer;">நீக்கு</button>
            </div>
        `).join("");

        videoPreviewContainer.querySelectorAll(".delete-video-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.getAttribute("data-id");
                if (confirm("இந்த வீடியோ இணைப்பை நீக்க விரும்புகிறீர்களா?")) {
                    try {
                        await deleteDocument(COLLECTIONS.VIDEOS, id);
                        showSuccess("வீடியோ நீக்கப்பட்டது");
                        await fetchAllDashboardData();
                        await loadVideoPreviews();
                    } catch (error) {
                        console.error(error);
                        showError("நீக்க முடியவில்லை");
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error loading video previews:", error);
    }
}

async function loadAssetSettings() {
    try {
        const assetsData = await getDocument(COLLECTIONS.SETTINGS, "assets");
        if (assetsData) {
            if (currentSignaturePreview && assetsData.founderSignatureUrl) {
                currentSignaturePreview.src = `${assetsData.founderSignatureUrl}?t=${Date.now()}`;
                currentSignaturePreview.style.display = "block";
            }
            if (currentDefaultPhotoPreview && assetsData.defaultPhotoUrl) {
                currentDefaultPhotoPreview.src = `${assetsData.defaultPhotoUrl}?t=${Date.now()}`;
                currentDefaultPhotoPreview.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error loading asset settings:", error);
    }
}

if (saveAssetSettingsBtn) {
    saveAssetSettingsBtn.addEventListener("click", async () => {
        try {
            if (dashboardLoader) dashboardLoader.style.display = "block";

            const existingAssets = await getDocument(COLLECTIONS.SETTINGS, "assets") || {};
            let founderSignatureUrl = existingAssets.founderSignatureUrl || "";
            let defaultPhotoUrl = existingAssets.defaultPhotoUrl || "";

            const sigFile = signatureUpload?.files?.[0];
            if (sigFile) {
                if (existingAssets.founderSignatureUrl) {
                    const oldPath = getPathFromUrl(existingAssets.founderSignatureUrl);
                    if (oldPath) {
                        try {
                            await deleteFile(oldPath);
                        } catch (storageError) {
                            console.warn("Storage deletion warning for old signature:", storageError);
                        }
                    }
                }
                founderSignatureUrl = await uploadSignature(sigFile);
            }

            const photoFile = defaultPhotoUpload?.files?.[0];
            if (photoFile) {
                if (existingAssets.defaultPhotoUrl) {
                    const oldPath = getPathFromUrl(existingAssets.defaultPhotoUrl);
                    if (oldPath) {
                        try {
                            await deleteFile(oldPath);
                        } catch (storageError) {
                            console.warn("Storage deletion warning for old default photo:", storageError);
                        }
                    }
                }
                defaultPhotoUrl = await uploadMemberPhoto("default_avatar_" + Date.now(), photoFile);
            }

            await setDocument(COLLECTIONS.SETTINGS, "assets", {
                founderSignatureUrl,
                defaultPhotoUrl
            });

            if (currentSignaturePreview && founderSignatureUrl) {
                currentSignaturePreview.src = `${founderSignatureUrl}?t=${Date.now()}`;
                currentSignaturePreview.style.display = "block";
            }
            if (currentDefaultPhotoPreview && defaultPhotoUrl) {
                currentDefaultPhotoPreview.src = `${defaultPhotoUrl}?t=${Date.now()}`;
                currentDefaultPhotoPreview.style.display = "block";
            }

            showSuccess("அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன");
        } catch (error) {
            console.error("Error saving asset settings:", error);
            showError("அமைப்புகளை சேமிக்க முடியவில்லை");
        } finally {
            if (dashboardLoader) dashboardLoader.style.display = "none";
        }
    });
}

if (signatureUpload) {
    signatureUpload.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (currentSignaturePreview) {
                currentSignaturePreview.src = URL.createObjectURL(file);
                currentSignaturePreview.style.display = "block";
            }
        }
    });
}

if (defaultPhotoUpload) {
    defaultPhotoUpload.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (currentDefaultPhotoPreview) {
                currentDefaultPhotoPreview.src = URL.createObjectURL(file);
                currentDefaultPhotoPreview.style.display = "block";
            }
        }
    });
}

if (qrUpload) {
    qrUpload.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const currentQrPreview = document.getElementById("currentQrPreview");
            if (currentQrPreview) {
                currentQrPreview.src = URL.createObjectURL(file);
                currentQrPreview.style.display = "block";
            }
        }
    });
}

// ========================================
// MOBILE SIDEBAR TOGGLE & OVERLAY SETUP
// ========================================
const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

if (sidebarToggle && sidebar && sidebarOverlay) {
    function toggleSidebar() {
        const isOpen = sidebar.classList.toggle("open");
        sidebarOverlay.classList.toggle("active", isOpen);
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("active");
    }

    sidebarToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });
}
