// ========================================
// IMPORTS
// ========================================

import {

    logout,

    watchAuth,

    recordLogin,

    sendLoginLink,

    isLoginLink,

    verifyLoginLink

}
    from "../firebase/auth.js";

import {

    getDocument

}
    from "../firebase/firestore.js";

import {

    MEMBER_STATUS,

    COLLECTIONS

}
    from "../utils/constants.js";

import {

    showSuccess

}
    from "../utils/toast.js";

// ========================================
// ELEMENTS
// ========================================

const memberLoginForm =
    document.getElementById(
        "memberLoginForm"
    );

const loginInfo =
    document.getElementById(
        "loginInfo"
    );

const loginError =
    document.getElementById(
        "loginError"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const logoutNavLi =
    document.getElementById(
        "logoutNavLi"
    );

// ========================================
// AUTH CHECK
// ========================================

let isFormSubmitting = false;

watchAuth(

    async user => {

        if (isFormSubmitting) {
            return;
        }

        try {

            if (!user) {
                if (logoutNavLi) logoutNavLi.style.display = "none";
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "block";
                const pendingSection = document.getElementById("pendingSection");
                if (pendingSection) pendingSection.style.display = "none";
                const rejectedSection = document.getElementById("rejectedSection");
                if (rejectedSection) rejectedSection.style.display = "none";
                return;
            }

            await user.reload();

            if (!user.emailVerified) {
                await logout();
                showErrorMessage("மின்னஞ்சல் சரிபார்க்கப்படவில்லை. முதலில் உங்கள் மின்னஞ்சலை சரிபார்க்கவும்.");
                return;
            }


            if (logoutNavLi) logoutNavLi.style.display = "block";

            const member =

                await getDocument(

                    COLLECTIONS.MEMBERS,

                    user.uid

                );

            if (!member) {
                return;
            }

            if (
                member.status ===
                MEMBER_STATUS.PENDING
            ) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const pendingSection = document.getElementById("pendingSection");
                if (pendingSection) pendingSection.style.display = "block";
                return;
            }

            if (
                member.status ===
                MEMBER_STATUS.REJECTED
            ) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const rejectedSection = document.getElementById("rejectedSection");
                if (rejectedSection) rejectedSection.style.display = "block";
                return;
            }

            if (
                member.status ===
                MEMBER_STATUS.APPROVED
            ) {
                if (
                    !window.location.pathname.includes(
                        "id-card-template.html"
                    )
                ) {
                    location.href =
                        "id-card-template.html";
                }
            }

        }
        catch (error) {

            console.error(
                error
            );

        }

    }

);

// ========================================
// EMAIL SIGN-IN LINK PROCESSOR
// ========================================

async function checkEmailSignInLink() {
    try {
        const currentUrl = window.location.href;
        if (isLoginLink(currentUrl)) {
            isFormSubmitting = true;

            if (memberLoginForm) {
                memberLoginForm.style.display = "none";
            }
            showInfoMessage("மின்னஞ்சல் இணைப்பு மூலம் உள்நுழைகிறது, தயவுசெய்து காத்திருக்கவும்...");

            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt("உள்நுழைவை உறுதிப்படுத்த உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்:");
            }
            if (!email) {
                throw new Error("உள்நுழைய மின்னஞ்சல் முகவரி தேவை.");
            }

            const user = await verifyLoginLink(email, currentUrl);
            window.localStorage.removeItem('emailForSignIn');

            await user.reload();

            const member = await getDocument(COLLECTIONS.MEMBERS, user.uid);
            if (!member) {
                throw new Error("உறுப்பினர் பதிவு காணப்படவில்லை");
            }

            if (member.status === MEMBER_STATUS.PENDING) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const pendingSection = document.getElementById("pendingSection");
                if (pendingSection) pendingSection.style.display = "block";
                isFormSubmitting = false;
                return;
            }

            if (member.status === MEMBER_STATUS.REJECTED) {
                const loginContainer = document.querySelector(".login-container");
                if (loginContainer) loginContainer.style.display = "none";
                const rejectedSection = document.getElementById("rejectedSection");
                if (rejectedSection) rejectedSection.style.display = "block";
                isFormSubmitting = false;
                return;
            }

            await recordLogin(user);

            // Clean query params from URL
            window.history.replaceState({}, document.title, window.location.pathname);

            location.href = "id-card-template.html";
        }
    } catch (error) {
        console.error("Error signing in with email link:", error);
        showErrorMessage(error.message || "மின்னஞ்சல் மூலம் உள்நுழைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
        isFormSubmitting = false;
        if (memberLoginForm) {
            memberLoginForm.style.display = "block";
        }
    }
}

// Check on DOM load
document.addEventListener("DOMContentLoaded", () => {
    checkEmailSignInLink();
});

// ========================================
// LOGIN
// ========================================

if (
    memberLoginForm
) {
    memberLoginForm.addEventListener(

        "submit",

        handleLogin

    );
}

// ========================================
// HANDLE LOGIN
// ========================================

async function handleLogin(
    event
) {
    event.preventDefault();

    const submitBtn = memberLoginForm?.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent || 'உள்நுழைவு இணைப்பு அனுப்பு';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'அனுப்பப்படுகிறது...';
    }

    try {
        hideError();

        const formData =

            new FormData(
                memberLoginForm
            );

        const email =
            formData.get(
                "email"
            )?.trim();

        if (!email) {
            throw new Error("மின்னஞ்சல் முகவரி தேவை.");
        }

        // Send login link using Firebase Auth
        await sendLoginLink(email, window.location.href);

        // Store email to complete sign in later on the same device
        window.localStorage.setItem('emailForSignIn', email);

        showInfoMessage("உள்நுழைவு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளது. மின்னஞ்சலைத் திறந்து இணைப்பைக் கிளிக் செய்யவும்.");

    }
    catch (error) {

        console.error(
            error
        );

        showErrorMessage(

            error.message ||

            "இணைப்பு அனுப்ப முடியவில்லை"

        );

    }
    finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

// ========================================
// ERROR
// ========================================

function showErrorMessage(
    message
) {
    if (
        !loginError
    ) {
        return;
    }

    if (loginInfo) {
        loginInfo.style.display = "none";
    }

    loginError.style.display =
        "block";

    loginError.textContent =
        message;
}

function showInfoMessage(
    message
) {
    if (
        !loginInfo
    ) {
        return;
    }

    if (loginError) {
        loginError.style.display = "none";
    }

    loginInfo.style.display =
        "block";

    loginInfo.textContent =
        message;
}

function hideError() {
    if (
        loginError
    ) {
        loginError.style.display =
            "none";

        loginError.textContent =
            "";
    }
    if (
        loginInfo
    ) {
        loginInfo.style.display =
            "none";

        loginInfo.textContent =
            "";
    }
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