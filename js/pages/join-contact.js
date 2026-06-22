// ========================================
// IMPORTS
// ========================================

import {

    registerMember

}
    from "../firebase/auth.js";

import { sendAdminNotification } from "../utils/email.js";

import {

    setDocument,

    createDocument,

    serverTimestamp,

    generateProblemNumber

}
    from "../firebase/firestore.js";

import {

    uploadMemberPhoto,

    uploadGovernmentProof

}
    from "../firebase/storage.js";

import {

    MEMBER_STATUS,

    COLLECTIONS

}
    from "../utils/constants.js";

import {

    validateRequiredFields,

    isValidEmail,

    isValidMobile,

    isStrongPassword,

    passwordsMatch,

    validateMemberPhoto,

    validateGovernmentProof,

    isAdult

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

const membershipForm =
    document.getElementById(
        "membershipForm"
    );

const problemReportForm =
    document.getElementById(
        "problemReportForm"
    );

const feedbackForm =
    document.getElementById(
        "feedbackForm"
    );

// ========================================
// INIT
// ========================================

if (
    membershipForm
) {
    membershipForm.addEventListener(

        "submit",

        handleMembershipSubmit

    );

    // ====================================
    // REAL-TIME FILE VALIDATION
    // ====================================

    const photoInput = document.getElementById("photoInput");
    const photoError = document.getElementById("photoError");
    const govProofInput = document.getElementById("govProofInput");
    const govProofError = document.getElementById("govProofError");

    const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const MAX_PHOTO_MB = 5 * 1024 * 1024;
    const MAX_PROOF_MB = 10 * 1024 * 1024;

    if (photoInput && photoError) {
        photoInput.addEventListener("change", () => {
            const file = photoInput.files[0];
            photoError.style.display = "none";
            photoError.textContent = "";

            if (!file) return;

            if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
                photoError.textContent = "❌ தவறான கோப்பு வகை. JPG, PNG அல்லது WEBP கோப்பை மட்டுமே பதிவேற்றவும்.";
                photoError.style.display = "block";
                photoInput.value = "";
                return;
            }

            if (file.size > MAX_PHOTO_MB) {
                photoError.textContent = `❌ புகைப்படம் மிகவும் பெரியது (${(file.size / 1024 / 1024).toFixed(2)} MB). அதிகபட்சம் 5 MB மட்டுமே அனுமதிக்கப்படும்.`;
                photoError.style.display = "block";
                photoInput.value = "";
                return;
            }

            photoError.textContent = "✅ புகைப்படம் சரியாக உள்ளது.";
            photoError.style.display = "block";
            photoError.style.color = "#16a34a";
        });
    }

    if (govProofInput && govProofError) {
        govProofInput.addEventListener("change", () => {
            const file = govProofInput.files[0];
            govProofError.style.display = "none";
            govProofError.textContent = "";

            if (!file) return;

            if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
                govProofError.textContent = "❌ தவறான கோப்பு வகை. JPG, PNG அல்லது PDF மட்டுமே அனுமதிக்கப்படும்.";
                govProofError.style.display = "block";
                govProofInput.value = "";
                return;
            }

            if (file.size > MAX_PROOF_MB) {
                govProofError.textContent = `❌ ஆவணம் மிகவும் பெரியது (${(file.size / 1024 / 1024).toFixed(2)} MB). அதிகபட்சம் 10 MB மட்டுமே அனுமதிக்கப்படும்.`;
                govProofError.style.display = "block";
                govProofInput.value = "";
                return;
            }

            govProofError.textContent = "✅ ஆவணம் சரியாக உள்ளது.";
            govProofError.style.display = "block";
            govProofError.style.color = "#16a34a";
        });
    }
}


if (
    problemReportForm
) {
    problemReportForm.addEventListener(

        "submit",

        async event => {

            event.preventDefault();

            try {

                const formData =
                    new FormData(
                        problemReportForm
                    );

                if (
                    !formData.get("reporterName") ||
                    !formData.get("reporterMobile") ||
                    !formData.get("problemDescription")
                ) {
                    throw new Error(
                        "அனைத்து கட்டாய விவரங்களையும் நிரப்பவும்"
                    );
                }

                const problemNumber = generateProblemNumber();

                await createDocument(

                    COLLECTIONS.GRIEVANCES,

                    {

                        problemNumber,

                        reporterName:
                            formData.get("reporterName")?.trim(),

                        reporterMobile:
                            formData.get("reporterMobile")?.trim(),

                        problemLocation:
                            formData.get("problemLocation")?.trim(),

                        problemCategory:
                            formData.get("problemCategory"),

                        problemDescription:
                            formData.get("problemDescription")?.trim(),

                        status:
                            "pending"

                    }

                );

                // Send email to admin
                try {
                    await sendAdminNotification({
                        subject: `புதிய பொதுமக்கள் புகார் | New Grievance: ${formData.get("reporterName")?.trim()} (${problemNumber})`,
                        html: `
                            <h3>புதிய பொதுமக்கள் புகார் பதிவு செய்யப்பட்டுள்ளது</h3>
                            <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; max-width: 600px;">
                                <tr><td><strong>டிராக்கிங் எண் (Tracking No):</strong></td><td>${problemNumber}</td></tr>
                                <tr><td><strong>பெயர் (Reporter Name):</strong></td><td>${formData.get("reporterName")?.trim()}</td></tr>
                                <tr><td><strong>மொபைல் (Reporter Mobile):</strong></td><td>${formData.get("reporterMobile")?.trim()}</td></tr>
                                <tr><td><strong>மாவட்டம்/வட்டம் (Location):</strong></td><td>${formData.get("problemLocation")?.trim() || "-"}</td></tr>
                                <tr><td><strong>வகை (Category):</strong></td><td>${formData.get("problemCategory")}</td></tr>
                                <tr><td><strong>விவரம் (Description):</strong></td><td>${formData.get("problemDescription")?.trim()}</td></tr>
                            </table>
                        `
                    });
                } catch (emailError) {
                    console.error("Could not send admin grievance notification email:", emailError);
                }

                showSuccess(

                    `உங்கள் பிரச்சினை வெற்றிகரமாக பதிவு செய்யப்பட்டது. டிராக்கிங் எண்: ${problemNumber}`

                );


                problemReportForm.reset();

            }
            catch (error) {

                console.error(error);

                showError(

                    "பிரச்சினையை பதிவு செய்ய முடியவில்லை"

                );

            }

        }

    );
}

if (
    feedbackForm
) {
    feedbackForm.addEventListener(

        "submit",

        async event => {

            event.preventDefault();

            try {

                const formData =
                    new FormData(
                        feedbackForm
                    );

                const feedbackName =
                    formData.get("feedbackName")?.trim();

                const feedbackMessage =
                    formData.get("feedbackMessage")?.trim();

                if (!feedbackName || !feedbackMessage) {
                    throw new Error("பெயர் மற்றும் கருத்து இரண்டும் கட்டாயம்");
                }

                await createDocument(

                    COLLECTIONS.CONTACT_MESSAGES,

                    {

                        feedbackName,

                        feedbackMobile:
                            formData.get("feedbackMobile")?.trim(),

                        feedbackEmail:
                            formData.get("feedbackEmail")?.trim(),

                        feedbackType:
                            formData.get("feedbackType"),

                        feedbackMessage,

                        createdAt: new Date()

                    }

                );

                showSuccess(

                    "உங்கள் கருத்து வெற்றிகரமாக பதிவு செய்யப்பட்டது"

                );

                feedbackForm.reset();

            }
            catch (error) {

                console.error(error);

                showError(

                    error.message || "கருத்தை பதிவு செய்ய முடியவில்லை"

                );

            }

        }

    );
}

// ========================================
// SUBMIT
// ========================================

async function handleMembershipSubmit(
    event
) {
    event.preventDefault();

    const submitBtn = membershipForm?.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent || 'சமர்ப்பிக்கவும்';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'சமர்ப்பிக்கிறது...';
    }

    try {

        const formData =

            new FormData(
                membershipForm
            );

        const fullName =
            formData.get(
                "fullName"
            )?.trim();

        const fatherName =
            formData.get(
                "fatherName"
            )?.trim();

        const mobile =
            formData.get(
                "mobile"
            )?.trim();

        const email =
            formData.get(
                "email"
            )?.trim();

        const password =
            formData.get(
                "password"
            );

        const confirmPassword =
            formData.get(
                "confirmPassword"
            );

        const address =
            formData.get(
                "address"
            )?.trim();

        const dob =
            formData.get(
                "dob"
            );

        const occupation =
            formData.get(
                "occupation"
            )?.trim();

        const gender =
            formData.get(
                "gender"
            );

        const bloodGroup =
            formData.get(
                "bloodGroup"
            );

        const whyJoin =
            formData.get(
                "whyJoin"
            )?.trim();

        const memberType =
            formData.get(
                "membertype"
            );

        const photo =

            formData.get(
                "photo"
            );

        const governmentProof =

            formData.get(
                "governmentProof"
            );

        // ====================================
        // VALIDATIONS
        // ====================================

        const valid =

            validateRequiredFields([

                fullName,

                fatherName,

                mobile,

                email,

                password,

                confirmPassword,

                address,

                dob,

                occupation,

                gender,

                photo,

                governmentProof,

                bloodGroup,

                whyJoin,

                memberType

            ]);

        if (
            !valid
        ) {
            throw new Error(
                "அனைத்து விவரங்களையும் நிரப்பவும்"
            );
        }

        if (
            !isValidEmail(
                email
            )
        ) {
            throw new Error(
                "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்"
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
            !isStrongPassword(
                password
            )
        ) {
            throw new Error(

                "கடவுச்சொல் பாதுகாப்பாக இல்லை"

            );
        }

        if (
            !passwordsMatch(

                password,

                confirmPassword

            )
        ) {
            throw new Error(

                "கடவுச்சொற்கள் பொருந்தவில்லை"

            );
        }

        if (
            !isAdult(
                dob
            )
        ) {
            throw new Error(

                "18 வயதிற்கு மேல் இருக்க வேண்டும்"

            );
        }

        if (
            !validateMemberPhoto(
                photo
            )
        ) {
            throw new Error(

                "சரியான புகைப்படத்தை பதிவேற்றவும்"

            );
        }

        if (
            !validateGovernmentProof(
                governmentProof
            )
        ) {
            throw new Error(

                "சரியான அரசு ஆவணத்தை பதிவேற்றவும்"

            );
        }

        // ====================================
        // AUTH ACCOUNT
        // ====================================

        let user = null;

        try {

            user =

                await registerMember({

                    fullName,

                    email,

                    password

                });

        }
        catch (error) {

            throw new Error(

                "உறுப்பினர் கணக்கை உருவாக்க முடியவில்லை"

            );

        }

        // ====================================
        // FILE UPLOADS
        // ====================================

        try {

            const photoUrl =

                await uploadMemberPhoto(

                    user.uid,

                    photo

                );

            const governmentProofPath =

                await uploadGovernmentProof(

                    user.uid,

                    governmentProof

                );

            // ====================================
            // MEMBER RECORD
            // ====================================


            await setDocument(

                COLLECTIONS.MEMBERS,

                user.uid,

                {

                    uid:
                        user.uid,

                    fullName,

                    fatherName,

                    mobile,

                    email,

                    address,

                    dob,

                    occupation,

                    gender,

                    bloodGroup,

                    whyJoin,

                    memberType,

                    photoUrl,

                    governmentProofPath,

                    governmentProofDeleted:
                        false,

                    memberNumber:
                        null,

                    status:
                        MEMBER_STATUS.PENDING,

                    createdAt:
                        serverTimestamp(),

                    approvedAt:
                        null,

                    rejectedAt:
                        null

                }

            );

            // Send email to admin
            try {
                await sendAdminNotification({
                    subject: `புதிய உறுப்பினர் சேர்க்கை விண்ணப்பம் | New Member Application: ${fullName}`,
                    html: `
                        <h3>புதிய உறுப்பினர் சேர்க்கை விண்ணப்பம் சமர்ப்பிக்கப்பட்டுள்ளது</h3>
                        <p>விண்ணப்பதாரர் விவரங்கள் பின்வருமாறு:</p>
                        <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; max-width: 600px;">
                            <tr><td><strong>முழு பெயர் (Full Name):</strong></td><td>${fullName}</td></tr>
                            <tr><td><strong>தந்தை பெயர் (Father's Name):</strong></td><td>${fatherName}</td></tr>
                            <tr><td><strong>மின்னஞ்சல் (Email):</strong></td><td>${email}</td></tr>
                            <tr><td><strong>கைபேசி எண் (Mobile):</strong></td><td>${mobile}</td></tr>
                            <tr><td><strong>பிறந்த தேதி (DOB):</strong></td><td>${dob}</td></tr>
                            <tr><td><strong>பாலினம் (Gender):</strong></td><td>${gender}</td></tr>
                            <tr><td><strong>இரத்த வகை (Blood Group):</strong></td><td>${bloodGroup}</td></tr>
                            <tr><td><strong>தொழில் (Occupation):</strong></td><td>${occupation}</td></tr>
                            <tr><td><strong>முகவரி (Address):</strong></td><td>${address}</td></tr>
                            <tr><td><strong>உறுப்பினர் வகை (Member Type):</strong></td><td>${memberType === "member" ? "உறுப்பினர் (Member)" : "செயல் உறுப்பினர் (Active Member)"}</td></tr>
                            <tr><td><strong>ஏன் இணைய விரும்புகிறார் (Reason to Join):</strong></td><td>${whyJoin}</td></tr>
                        </table>
                        <p>விவரங்களை சரிபார்த்து ஒப்புதல் வழங்க நிர்வாக கட்டுப்பாட்டு மையத்திற்குச் செல்லவும்.</p>
                    `
                });
            } catch (emailError) {
                console.error("Could not send admin membership notification email:", emailError);
            }

            showSuccess(

                "பதிவு வெற்றிகரமாக முடிந்தது. உங்கள் மின்னஞ்சலை சரிபார்க்கவும்."

            );

            membershipForm.reset();


        }
        catch (error) {

            console.error("Error in file uploads or Firestore process:", error);

            throw error;

        }

    }

    catch (error) {

        console.error(error);

        showError(

            error.message ||

            "பதிவு செய்ய முடியவில்லை"

        );

    }
    finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }

}