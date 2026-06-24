// ========================================
// IMPORTS
// ========================================

import {

    watchAuth,

    logout,

    isAdmin

}
    from "../firebase/auth.js";

import {

    getDocument

}
    from "../firebase/firestore.js";

import {

    formatDate

}
    from "../utils/helpers.js";

import {

    getMemberTypeTamil

}
    from "../utils/helpers.js";

import {

    showError,

    showWarning

}
    from "../utils/toast.js";

import {

    MEMBER_STATUS,

    COLLECTIONS

}
    from "../utils/constants.js";

// ========================================
// ELEMENTS
// ========================================

const validStatusSection =
    document.getElementById(
        "validStatusSection"
    );

const invalidStatusSection =
    document.getElementById(
        "invalidStatusSection"
    );

const downloadPdfBtn =
    document.getElementById(
        "downloadPdfBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

// ========================================
// AUTH CHECK
// ========================================

const urlParams = new URLSearchParams(window.location.search);
const memberIdParam = urlParams.get("memberId");

watchAuth(

    async user => {

        if (!user) {
            location.href =
                "member-login.html";

            return;
        }

        if (memberIdParam) {
            try {
                const adminCheck = await isAdmin(user.uid);
                const isSelf = user.uid === memberIdParam;
                if (adminCheck || isSelf) {
                    await loadMemberCard(memberIdParam);
                    
                    // Show a message/spinner or indicator that it is generating
                    showWarning("அடையாள அட்டை பதிவிறக்கம் செய்யப்படுகிறது... / Downloading ID Card...");

                    // Wait for rendering and image load, then trigger PDF generation
                    setTimeout(async () => {
                        await downloadIdCardPDF();
                        window.close();
                    }, 2000);
                    return;
                } else {
                    showError("அனுமதி இல்லை / Unauthorized");
                    showInvalid();
                    return;
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                showInvalid();
                return;
            }
        }

        if (!user.emailVerified) {
            if (user) {
                await logout();
            }
            location.href =
                "member-login.html";

            return;
        }

        await loadMemberCard(
            user.uid
        );

    }

);


// ========================================
// LOAD MEMBER
// ========================================

let assetSettings = null;

async function loadMemberCard(
    uid
) {
    try {
        try {
            assetSettings = await getDocument(COLLECTIONS.SETTINGS, "assets");
        } catch (err) {
            console.warn("Asset settings document could not be loaded:", err);
        }

        const member =

            await getDocument(

                COLLECTIONS.MEMBERS,

                uid

            );

        if (
            !member
        ) {
            showInvalid();

            return;
        }

        if (
            member.status !==
            MEMBER_STATUS.APPROVED
        ) {
            showInvalid();

            return;
        }

        if (
            member.active === false ||
            member.active === "false"
        ) {
            showInvalid();
            return;
        }

        showValid();

        renderCard(
            member
        );

    }
    catch (error) {

        console.error(
            error
        );

        showError(

            "அடையாள அட்டையை ஏற்ற முடியவில்லை"

        );

    }
}

// ========================================
// SHOW VALID
// ========================================

function showValid() {

    const downloadSection =
        document.querySelector(
            ".download-section"
        );

    if (downloadSection) {

        downloadSection.style.display =
            "block";
    }

    if (
        validStatusSection
    ) {
        validStatusSection.style.display =
            "block";
    }

    if (
        invalidStatusSection
    ) {
        invalidStatusSection.style.display =
            "none";
    }

    const idCardPage =
        document.getElementById(
            "idCardPage"
        );

    if (idCardPage) {
        idCardPage.style.display =
            "block";
    }
}

// ========================================
// SHOW INVALID
// ========================================

function showInvalid() {
    if (
        validStatusSection
    ) {
        validStatusSection.style.display =
            "none";
    }

    if (
        invalidStatusSection
    ) {
        invalidStatusSection.style.display =
            "block";
    }

    const idCardPage =
        document.getElementById(
            "idCardPage"
        );

    if (idCardPage) {
        idCardPage.style.display =
            "none";
    }

    const downloadSection =
        document.querySelector(
            ".download-section"
        );

    if (downloadSection) {
        downloadSection.style.display =
            "none";
    }
}

// ========================================
// RENDER CARD
// ========================================

function renderCard(
    member
) {
    setText(

        "memberName",

        member.fullName

    );

    setText(

        "memberFatherName",

        member.fatherName

    );

    setText(

        "memberDob",

        member.dob ? formatDate(member.dob) : "-"

    );

    setText(

        "memberNumber",

        member.memberNumber

    );

    setText(

        "memberType",

        getMemberTypeTamil(member.memberType)

    );

    setText(

        "memberBloodGroup",

        member.bloodGroup

    );

    setText(

        "memberMobile",

        member.mobile

    );

    setText(

        "memberEmail",

        member.email

    );

    setText(

        "memberAddress",

        member.address

    );

    setText(

        "memberIssueDate",

        member.approvedAt
            ? formatDate(
                member.approvedAt
            )
            : "-"

    );

    const photo =

        document.getElementById(
            "memberPhoto"
        );

    const fallbackPhoto = assetSettings?.defaultPhotoUrl || "images/default-user.jpg";

    if (photo) {
        photo.onerror = () => {

            photo.onerror = null;

            photo.src = fallbackPhoto;
        };

        photo.src =
            member.photoUrl || fallbackPhoto;
    }

    const signature =

        document.getElementById(
            "founderSignature"
        );

    const fallbackSignature = assetSettings?.founderSignatureUrl || "images/signature.png";

    if (signature) {
        signature.onerror = () => {

            signature.onerror = null;

            signature.src = fallbackSignature;
        };

        signature.src =
            member.signatureUrl || fallbackSignature;
    }

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

    if (
        element
    ) {
        element.textContent =
            value || "-";
    }
}

// ========================================
// PDF DOWNLOAD
// ========================================

async function downloadIdCardPDF() {
    try {
        const card =
            document.querySelector(
                ".member-id-card"
            );

        if (!card) {
            showError(
                "அடையாள அட்டை கிடைக்கவில்லை"
            );
            return;
        }

        const canvas =
            await html2canvas(
                card,
                {
                    scale: 3,
                    useCORS: true,
                    allowTaint: false,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: document.documentElement.clientWidth,
                    windowHeight: document.documentElement.clientHeight
                }
            );

        const imageData =
            canvas.toDataURL(
                "image/png"
            );

        const {
            jsPDF
        } = window.jspdf;

        const pdf =
            new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [54, 85.6]
            });

        pdf.addImage(
            imageData,
            "PNG",
            0,
            0,
            54,
            85.6
        );

        const memberNumber =
            document.getElementById(
                "memberNumber"
            )?.textContent ||
            "unknown";

        pdf.save(
            `member-${memberNumber}.pdf`
        );
    }
    catch (error) {
        console.error(
            error
        );

        showError(
            "PDF உருவாக்க முடியவில்லை"
        );
    }
}

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener(

        "click",

        async () => {
            await downloadIdCardPDF();
        }

    );
}

// ========================================
// LOGOUT
// ========================================

if (
    logoutBtn
) {
    logoutBtn.addEventListener(

        "click",

        async () => {

            try {

                await logout();

                location.href =
                    "member-login.html";

            }
            catch (error) {

                console.error(
                    error
                );

            }

        }

    );
}
