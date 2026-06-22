// ========================================
// FIREBASE CONFIGURATION
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import {
    getAuth
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    getFirestore
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
    getStorage
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

import {
    initializeAppCheck,
    ReCaptchaV3Provider
}
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check.js";

// ========================================
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyADJiz8metNI-0-M45bxNxv-j9ZkrWh-Ts",
    authDomain: "thamarai-charitable-trust.firebaseapp.com",
    projectId: "thamarai-charitable-trust",
    storageBucket: "thamarai-charitable-trust.firebasestorage.app",
    messagingSenderId: "26789490695",
    appId: "1:26789490695:web:c2c2f547e0d3d932fdfaa2",
    measurementId: "G-LEEZY0P08W"
};

// ========================================
// INITIALIZE FIREBASE
// ========================================

const app =
    initializeApp(
        firebaseConfig
    );

// ========================================
// APP CHECK INITIALIZATION
// ========================================

// Enable App Check debug token for local development (localhost or 127.0.0.1)
if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1")
) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = "bc9a6d89-1d69-48fd-b194-971794d5c132";
}

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6Ld18ywtAAAAAEuQNLyxjbaVKPV6AP3K7rtxfL3j"),
    isTokenAutoRefreshEnabled: true
});

// ========================================
// SERVICES
// ========================================

const auth =
    getAuth(
        app
    );

const db =
    getFirestore(
        app
    );

const storage =
    getStorage(
        app
    );

// ========================================
// EXPORTS
// ========================================

export {

    app,

    auth,

    db,

    storage,

    appCheck

};