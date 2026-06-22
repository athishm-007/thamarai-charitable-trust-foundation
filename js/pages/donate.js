// ========================================
// IMPORTS
// ========================================

import {

    createDocument,

    getDocument

}
    from "../firebase/firestore.js";


import {

    COLLECTIONS,

    DONATION_STATUS

}
    from "../utils/constants.js";

import {

    isValidMobile,

    validateRequiredFields

}
    from "../utils/validators.js";

import {

    showSuccess,

    showError

}
    from "../utils/toast.js";

// ========================================
// ELEMENTS
// ========================================

const donationForm =
    document.getElementById(
        "donationForm"
    );

const paymentSection =
    document.getElementById(
        "paymentSection"
    );

const upiId =

    document.getElementById(
        "upiId"
    );

const donationQr =
    document.getElementById(
        "donationQr"
    );

// ========================================
// INIT
// ========================================

if (
    donationForm
) {
    donationForm.addEventListener(

        "submit",

        handleDonation

    );
}

// ========================================
// DONATION SUBMIT
// ========================================

async function handleDonation(
    event
) {
    event.preventDefault();

    try {

        const formData =

            new FormData(
                donationForm
            );

        const fullName =
            formData.get(
                "fullName"
            )?.trim();

        const mobile =
            formData.get(
                "mobile"
            )?.trim();

        const amount =
            formData.get(
                "amount"
            );

        const message =
            formData.get(
                "message"
            )?.trim();

        // ====================================
        // VALIDATIONS
        // ====================================

        const valid =

            validateRequiredFields([

                fullName,

                mobile,

                amount

            ]);

        if (
            !valid
        ) {
            throw new Error(

                "அனைத்து கட்டாய விவரங்களையும் நிரப்பவும்"

            );
        }

        if (
            !isValidMobile(
                mobile
            )
        ) {
            throw new Error(

                "சரியான மொபைல் எண்ணை உள்ளிடவும்"

            );
        }

        const donationAmount =
            Number(amount);

        if (
            Number.isNaN(donationAmount) ||
            donationAmount <= 0
        ) {
            throw new Error(

                "சரியான நன்கொடை தொகையை உள்ளிடவும்"

            );
        }

        // ====================================
        // SAVE DONOR DETAILS
        // ====================================

        await createDocument(

            COLLECTIONS.DONATIONS,

            {

                fullName,

                mobile,

                amount:
                    donationAmount,

                message,

                paymentStatus:
                    DONATION_STATUS.AWAITING_PAYMENT

            }

        );


        // ====================================
        // SHOW PAYMENT SECTION
        // ====================================

        donationForm.reset();

        donationForm.style.display =
            "none";

        if (
            paymentSection
        ) {
            paymentSection.style.display =
                "block";
        }

        try {
            const paymentData = await getDocument(COLLECTIONS.SETTINGS, "payment");
            if (paymentData) {
                if (donationQr && paymentData.qrUrl) {
                    donationQr.src = paymentData.qrUrl;
                } else if (donationQr) {
                    donationQr.src = "images/donation-qr.jpg";
                }
                if (upiId && paymentData.upiId) {
                    upiId.textContent = paymentData.upiId;
                } else if (upiId) {
                    upiId.textContent = "yourupi@okaxis";
                }
            } else {
                if (donationQr) {
                    donationQr.src = "images/donation-qr.jpg";
                }
                if (upiId) {
                    upiId.textContent = "yourupi@okaxis";
                }
            }
        } catch (err) {
            console.error("Error loading payment settings in donate:", err);
            if (donationQr) {
                donationQr.src = "images/donation-qr.jpg";
            }
            if (upiId) {
                upiId.textContent = "yourupi@okaxis";
            }
        }


        showSuccess(

            "தகவல்கள் பதிவு செய்யப்பட்டன. இப்போது QR குறியீட்டை ஸ்கேன் செய்து நன்கொடை வழங்குங்கள்."

        );

    }
    catch (error) {

        console.error(
            error
        );

        showError(

            error.message ||

            "நன்கொடை பதிவு செய்ய முடியவில்லை"

        );

    }
}