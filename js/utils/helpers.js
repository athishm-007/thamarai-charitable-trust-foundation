// ========================================
// DATE FORMAT
// ========================================

export function formatDate(
    value
) {
    if (!value) {
        return "-";
    }

    try {

        const date =

            value?.seconds

                ?

                new Date(
                    value.seconds * 1000
                )

                :

                new Date(
                    value
                );

        return date.toLocaleDateString(

            "ta-IN",

            {

                year:
                    "numeric",

                month:
                    "long",

                day:
                    "numeric"

            }

        );

    }
    catch {

        return "-";

    }
}

// ========================================
// DATE TIME FORMAT
// ========================================

export function formatDateTime(
    value
) {
    if (!value) {
        return "-";
    }

    try {

        const date =

            value?.seconds

                ?

                new Date(
                    value.seconds * 1000
                )

                :

                new Date(
                    value
                );

        return date.toLocaleString(

            "ta-IN"

        );

    }
    catch {

        return "-";

    }
}

// ========================================
// TRIM TEXT
// ========================================

export function sanitizeText(
    value
) {
    return value
        ?.trim()
        ?.replace(
            /\s+/g,
            " "
        );
}

// ========================================
// GET FILE EXTENSION
// ========================================

export function getFileExtension(
    fileName
) {
    return fileName
        .split(".")
        .pop()
        .toLowerCase();
}

// ========================================
// FORMAT FILE SIZE
// ========================================

export function formatFileSize(
    bytes
) {
    if (
        bytes < 1024
    ) {
        return `${bytes} B`;
    }

    if (
        bytes < 1024 * 1024
    ) {
        return `${(

            bytes / 1024

        ).toFixed(2)} KB`;
    }

    return `${(

        bytes / 1024 / 1024

    ).toFixed(2)} MB`;
}

// ========================================
// DEBOUNCE
// ========================================

export function debounce(

    callback,

    delay = 300

) {
    let timer;

    return (...args) => {

        clearTimeout(
            timer
        );

        timer =
            setTimeout(

                () => {

                    callback(
                        ...args
                    );

                },

                delay

            );

    };
}

// ========================================
// EMPTY CHECK
// ========================================

export function isEmpty(
    value
) {
    return (

        value === null ||

        value === undefined ||

        value === ""

    );
}

// ========================================
// RANDOM ID
// ========================================

export function generateId() {
    return crypto.randomUUID();
}

// ========================================
// COPY TO CLIPBOARD
// ========================================

export async function copyText(
    text
) {
    try {

        await navigator
            .clipboard
            .writeText(
                text
            );

        return true;

    }
    catch {

        return false;

    }
}

// ========================================
// OPEN URL
// ========================================

export function openUrl(
    url
) {
    window.open(

        url,

        "_blank",

        "noopener,noreferrer"

    );
}

// ========================================
// MEMBER STATUS TAMIL
// ========================================

export function getMemberStatusTamil(
    status
) {
    const statuses = {

        pending:
            "நிலுவையில்",

        approved:
            "ஒப்புதல் பெற்றது",

        rejected:
            "நிராகரிக்கப்பட்டது"

    };

    return statuses[status] || status;
}

// ========================================
// PROBLEM STATUS TAMIL
// ========================================

export function getProblemStatusTamil(
    status
) {
    const statuses = {

        pending:
            "நிலுவையில்",

        "under-review":
            "பரிசீலனையில்",

        resolved:
            "தீர்க்கப்பட்டது",

        closed:
            "மூடப்பட்டது"

    };

    return statuses[status] || status;
}

// ========================================
// BLOOD REQUEST STATUS TAMIL
// ========================================

export function getBloodStatusTamil(
    status
) {
    const statuses = {

        pending:
            "நிலுவையில்",

        fulfilled:
            "நிறைவேற்றப்பட்டது",

        closed:
            "மூடப்பட்டது"

    };

    return statuses[status] || status;
}

// ========================================
// SCROLL TO TOP
// ========================================

export function scrollToTop() {
    window.scrollTo({

        top: 0,

        behavior:
            "smooth"

    });
}

// ========================================
// MEMBER TYPE TAMIL
// ========================================

export function getMemberTypeTamil(
    type
) {
    const types = {

        "member":
            "உறுப்பினர்",

        "active-member":
            "செயல் உறுப்பினர்"

    };

    return types[type] || type || "-";
}

// ========================================
// HTML ESCAPE (XSS PREVENTION)
// ========================================

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}