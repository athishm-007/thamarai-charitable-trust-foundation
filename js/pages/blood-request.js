// ========================================
// IMPORTS
// ========================================

import {

    createDocument

}
    from "../firebase/firestore.js";

import { sendAdminNotification } from "../utils/email.js";

import {

    COLLECTIONS,

    BLOOD_REQUEST_STATUS

}
    from "../utils/constants.js";

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

// ========================================
// ELEMENTS
// ========================================

const bloodRequestForm =
    document.getElementById(
        "bloodRequestForm"
    );

// ========================================
// SUBMIT
// ========================================

if (
    bloodRequestForm
) {
    bloodRequestForm.addEventListener(

        "submit",

        handleBloodRequest

    );
}

// ========================================
// CREATE REQUEST
// ========================================

async function handleBloodRequest(
    event
) {
    event.preventDefault();

    try {

        const formData =

            new FormData(
                bloodRequestForm
            );

        const patientName =
            formData.get(
                "patientName"
            )?.trim();

        const contactPerson =
            formData.get(
                "contactPerson"
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

        const gender =
            formData.get(
                "gender"
            );

        const priority =
            formData.get(
                "priority"
            );

        const bloodGroup =
            formData.get(
                "bloodGroup"
            );

        const hospitalName =
            formData.get(
                "hospitalName"
            )?.trim();

        const hospitalAddress =
            formData.get(
                "hospitalAddress"
            )?.trim();

        const district =
            formData.get(
                "district"
            )?.trim();

        const unitsRequired =
            formData.get(
                "unitsRequired"
            );

        const additionalNotes =
            formData.get(
                "additionalNotes"
            )?.trim();

        const valid =

            validateRequiredFields([

                patientName,

                contactPerson,

                mobile,

                bloodGroup,

                hospitalName,

                hospitalAddress,

                district,

                age,

                priority,

                unitsRequired

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

        if (
            Number(unitsRequired) <= 0
        ) {
            throw new Error(
                "தேவையான யூனிட்களின் எண்ணிக்கை சரியாக இல்லை"
            );
        }

        await createDocument(

            COLLECTIONS.BLOOD_REQUESTS,

            {
                patientName,

                age,

                gender,

                bloodGroup,

                unitsRequired,

                hospitalName,

                hospitalAddress,

                district,

                priority,

                contactPerson,

                mobile,

                email,

                additionalNotes,

                status:
                    BLOOD_REQUEST_STATUS.PENDING
            }

        );

        // Send email to admin
        try {
            await sendAdminNotification({
                subject: `புதிய இரத்த தேவைக் கோரிக்கை | New Blood Request: Patient - ${patientName}`,
                html: `
                    <h3>புதிய இரத்த தேவைக் கோரிக்கை பதிவு செய்யப்பட்டுள்ளது</h3>
                    <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; max-width: 600px;">
                        <tr><td><strong>நோயாளர் பெயர் (Patient Name):</strong></td><td>${patientName}</td></tr>
                        <tr><td><strong>வயது (Age):</strong></td><td>${age}</td></tr>
                        <tr><td><strong>பாலினம் (Gender):</strong></td><td>${gender}</td></tr>
                        <tr><td><strong>இரத்த வகை (Blood Group):</strong></td><td>${bloodGroup}</td></tr>
                        <tr><td><strong>தேவைப்படும் யூனிட்டுகள் (Units Required):</strong></td><td>${unitsRequired}</td></tr>
                        <tr><td><strong>மருத்துவமனை பெயர் (Hospital Name):</strong></td><td>${hospitalName}</td></tr>
                        <tr><td><strong>மருத்துவமனை முகவரி (Hospital Address):</strong></td><td>${hospitalAddress}</td></tr>
                        <tr><td><strong>மாவட்டம் (District):</strong></td><td>${district}</td></tr>
                        <tr><td><strong>முன்னுரிமை நிலை (Priority):</strong></td><td>${priority === "urgent" ? "அவசரம் (Urgent)" : "சாதாரணமானது (Normal)"}</td></tr>
                        <tr><td><strong>தொடர்பு நபர் (Contact Person):</strong></td><td>${contactPerson}</td></tr>
                        <tr><td><strong>மொபைல் (Mobile):</strong></td><td>${mobile}</td></tr>
                        <tr><td><strong>மின்னஞ்சல் (Email):</strong></td><td>${email || "-"}</td></tr>
                        <tr><td><strong>கூடுதல் விவரங்கள் (Additional Notes):</strong></td><td>${additionalNotes || "-"}</td></tr>
                    </table>
                `
            });
        } catch (emailError) {
            console.error("Could not send admin blood request email notification:", emailError);
        }

        showSuccess(
            "இரத்த தேவைக் கோரிக்கை பதிவு செய்யப்பட்டது"
        );
        const requestForm = document.getElementById("request-form");
        if (requestForm) {
            requestForm.style.display = "none";
        }
        const successSec = document.getElementById("request-success");
        if (successSec) {
            successSec.style.display = "block";
        }
        bloodRequestForm.reset();


    }
    catch (error) {

        console.error(
            error
        );

        showError(

            error.message ||

            "கோரிக்கையை பதிவு செய்ய முடியவில்லை"

        );

    }
}