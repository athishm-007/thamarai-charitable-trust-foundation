// ========================================
// IMPORTS
// ========================================

import {

    logout,

    watchAuth,

    recordLogin,

    isAdmin,

    sendLoginLink,

    isLoginLink,

    verifyLoginLink

}
    from "../firebase/auth.js";

import {

    showSuccess,

    showError

}
    from "../utils/toast.js";

// ========================================
// ELEMENTS
// ========================================

const adminLoginForm =
    document.getElementById(
        "adminLoginForm"
    );

const loginInfo =
    document.getElementById(
        "loginInfo"
    );

const loginError =
    document.getElementById(
        "loginError"
    );

const loginLoading =
    document.getElementById(
        "loginLoading"
    );

const adminLoginBtn =
    document.getElementById(
        "adminLoginBtn"
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
                return;
            }

            await user.reload();

            if (!user.emailVerified) {
                await logout();
                showErrorMessage("மின்னஞ்சல் சரிபார்க்கப்படவில்லை. முதலில் உங்கள் மின்னஞ்சலை சரிபார்க்கவும்.");
                return;
            }

            const admin =
                await isAdmin(
                    user.uid
                );

            if (
                admin &&
                !window.location.pathname.includes(
                    "admin-dashboard.html"
                )
            ) {
                location.href =
                    "admin-dashboard.html";
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

            if (adminLoginForm) {
                adminLoginForm.style.display = "none";
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

            const admin = await isAdmin(user.uid);
            if (!admin) {
                throw new Error("நிர்வாகி அனுமதி இல்லை");
            }

            await recordLogin(user);

            // Clean query params from URL
            window.history.replaceState({}, document.title, window.location.pathname);

            showSuccess("நிர்வாகி உள்நுழைவு வெற்றிகரமாக முடிந்தது");

            setTimeout(() => {
                location.href = "admin-dashboard.html";
            }, 1000);
        }
    } catch (error) {
        console.error("Error signing in with email link:", error);
        showErrorMessage(error.message || "மின்னஞ்சல் மூலம் உள்நுழைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
        isFormSubmitting = false;
        if (adminLoginForm) {
            adminLoginForm.style.display = "block";
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
    adminLoginForm
) {
    adminLoginForm.addEventListener(

        "submit",

        handleAdminLogin

    );
}

// ========================================
// HANDLE LOGIN
// ========================================

async function handleAdminLogin(
    event
) {
    event.preventDefault();

    if (loginLoading) {
        loginLoading.style.display =
            "block";
    }

    if (adminLoginBtn) {
        adminLoginBtn.disabled =
            true;
    }

    try {
        hideError();

        const formData =

            new FormData(
                adminLoginForm
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

        if (loginLoading) {
            loginLoading.style.display = "none";
        }

        showInfoMessage("உள்நுழைவு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளது. மின்னஞ்சலைத் திறந்து இணைப்பைக் கிளிக் செய்யவும்.");

    }
    catch (error) {

        console.error(
            error
        );

        let message =
            error.message ||
            "இணைப்பு அனுப்ப முடியவில்லை";

        showErrorMessage(
            message
        );

        if (loginLoading) {
            loginLoading.style.display =
                "none";
        }

    }
    finally {
        if (adminLoginBtn) {
            adminLoginBtn.disabled =
                false;
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