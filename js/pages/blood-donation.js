// ========================================
// IMPORTS
// ========================================

import {

    createDocument

}
    from "../firebase/firestore.js";



import {

    validateRequiredFields,

    isValidMobile,

    isValidEmail

}
    from "../utils/validators.js";

import {

    showSuccess,

    showError

}
    from "../utils/toast.js";

import {

    COLLECTIONS,

    BLOOD_DONOR_STATUS

}
    from "../utils/constants.js";

// ========================================
// ELEMENTS
// ========================================

const bloodDonationForm =
    document.getElementById(
        "bloodDonorForm"
    );

// ========================================
// FORM SUBMIT
// ========================================

if (
    bloodDonationForm
) {
    bloodDonationForm.addEventListener(

        "submit",

        handleDonationRegistration

    );
}

// ========================================
// REGISTER DONOR
// ========================================

async function handleDonationRegistration(
    event
) {
    event.preventDefault();

    try {

        const formData =

            new FormData(
                bloodDonationForm
            );

        const fullName =
            formData.get(
                "fullName"
            )?.trim();

        const mobile =
            formData.get(
                "mobile"
            )?.trim();

        const email =
            formData.get(
                "email"
            )?.trim();

        const age =
            formData.get(
                "age"
            );

        if (
            Number(age) < 18 ||
            Number(age) > 65
        ) {
            throw new Error(
                "18 முதல் 65 வயதுக்குள் இருக்க வேண்டும்"
            );
        }

        const gender =
            formData.get(
                "gender"
            );

        const previousDonation =
            formData.get(
                "previousDonation"
            );

        const lastDonationDate =
            formData.get(
                "lastDonationDate"
            );

        const emergencyPermission =
            formData.get(
                "emergencyPermission"
            );

        const bloodGroup =
            formData.get(
                "bloodGroup"
            );

        const district =
            formData.get(
                "district"
            )?.trim();

        const address =
            formData.get(
                "address"
            )?.trim();

        const valid =

            validateRequiredFields([

                fullName,

                email,

                age,

                gender,

                mobile,

                bloodGroup,

                district,

                previousDonation,

                emergencyPermission

            ]);

        if (
            !valid
        ) {
            throw new Error(

                "அனைத்து கட்டாய தகவல்களையும் நிரப்பவும்"

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

        if (

            email &&

            !isValidEmail(
                email
            )

        ) {
            throw new Error(

                "சரியான மின்னஞ்சலை உள்ளிடவும்"

            );
        }

        await createDocument(

            COLLECTIONS.BLOOD_DONORS,

            {

                fullName,

                age,

                gender,

                mobile,

                email,

                bloodGroup,

                district,

                address,

                previousDonation,

                lastDonationDate,

                emergencyPermission,

                status:
                    BLOOD_DONOR_STATUS.ACTIVE

            }

        );



        showSuccess(
            "இரத்த தான பதிவாளர் பட்டியலில் சேர்க்கப்பட்டுள்ளீர்கள்"
        );
        const donorForm = document.getElementById("donor-form");
        if (donorForm) {
            donorForm.style.display = "none";
        }
        const successSec = document.getElementById("registration-success");
        if (successSec) {
            successSec.style.display = "block";
        }
        bloodDonationForm.reset();


    }
    catch (error) {

        console.error(
            error
        );

        showError(

            error.message ||

            "பதிவு செய்ய முடியவில்லை"

        );

    }
}