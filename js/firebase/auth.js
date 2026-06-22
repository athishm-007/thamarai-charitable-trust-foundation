/* ==========================================================================
   AUTHENTICATION UTILITIES (FIREBASE AUTH + FIRESTORE)
   ========================================================================== */

import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    getDocument,
    createDocument
} from "./firestore.js";

// Firestore collections owned by this module
const ADMINS_COLLECTION = "admins";
const LOGIN_HISTORY_COLLECTION = "loginHistory";

// ========================================
// WATCH AUTH STATE
// ========================================
export function watchAuth(callback) {
    return onAuthStateChanged(auth, callback);
}

// ========================================
// LOGIN (used for both members and admins)
// ========================================
export async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

// ========================================
// REGISTER MEMBER
// ========================================
export async function registerMember({ fullName, email, password }) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    try {
        await sendEmailVerification(userCredential.user);
    } catch (error) {
        // Don't block registration if the verification email fails to send
        console.error("Could not send verification email:", error);
    }

    return userCredential.user;
}

// ========================================
// LOGOUT
// ========================================
export async function logout() {
    await signOut(auth);
}

// ========================================
// PASSWORD RESET
// ========================================
export async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
}

// ========================================
// SEND EMAIL VERIFICATION
// ========================================
export async function sendVerification(user) {
    if (user) {
        await sendEmailVerification(user);
    }
}

// ========================================
// PASSWORDLESS / MAGIC LINK SIGN-IN HELPERS
// ========================================
export function isLoginLink(url) {
    return isSignInWithEmailLink(auth, url);
}

export async function sendLoginLink(email, redirectUrl) {
    const actionCodeSettings = {
        url: redirectUrl,
        handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
}

export async function verifyLoginLink(email, emailLink) {
    const result = await signInWithEmailLink(auth, email, emailLink);
    return result.user;
}


// ========================================
// CHECK ADMIN ROLE
// ========================================
export async function isAdmin(uid) {
    if (!uid) {
        return false;
    }

    try {
        const adminDoc = await getDocument(ADMINS_COLLECTION, uid);
        return !!adminDoc;
    } catch (error) {
        console.error("Error checking admin role:", error);
        return false;
    }
}

// ========================================
// RECORD LOGIN HISTORY
// ========================================
export async function recordLogin(user) {
    if (!user) {
        return;
    }

    try {
        await createDocument(LOGIN_HISTORY_COLLECTION, {
            uid: user.uid,
            email: user.email,
            device: navigator.userAgent.substring(0, 100)
        });
    } catch (error) {
        console.error("Error recording login history:", error);
    }
}