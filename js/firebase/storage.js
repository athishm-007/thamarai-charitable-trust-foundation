// ========================================
// SUPABASE STORAGE INTEGRATION
// ========================================

import { supabase, BUCKET_NAME } from "../supabase-config.js";

// ========================================
// UPLOAD MEMBER PHOTO
// ========================================
export async function uploadMemberPhoto(uid, file) {
    const filePath = `memberPhotos/${uid}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
}

// ========================================
// UPLOAD GOVERNMENT PROOF
// ========================================
export async function uploadGovernmentProof(uid, file) {
    const extension = file.name.split(".").pop();
    const filePath = `governmentProofs/${uid}.${extension}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    // We return the path for database storage
    return filePath;
}

// ========================================
// GET GOVERNMENT PROOF VIEW URL
// Government proofs are private — we don't store a public URL for them.
// Instead, generate a short-lived signed URL on demand when an admin
// needs to view one.
// ========================================
export async function getGovernmentProofUrl(proofPath, expiresInSeconds = 3600) {
    if (!proofPath) return null;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(proofPath, expiresInSeconds);

    if (error) {
        console.error("Error creating signed URL for government proof:", error);
        return null;
    }

    return data.signedUrl;
}

// ========================================
// DELETE GOVERNMENT PROOF
// ========================================
export async function deleteGovernmentProof(proofPath) {
    if (!proofPath) return;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([proofPath]);

    if (error) console.error("Error deleting proof:", error);
}

// ========================================
// UPLOAD EVENT IMAGE
// ========================================
export async function uploadEventImage(eventId, file) {
    const filePath = `events/${eventId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
}

// ========================================
// UPLOAD GALLERY IMAGE
// ========================================
export async function uploadGalleryImage(file) {
    const filePath = `gallery/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
}

// ========================================
// UPLOAD FOUNDER IMAGE
// ========================================
export async function uploadFounderImage(file) {
    const filePath = `founder/${file.name}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
}

// ========================================
// UPLOAD SIGNATURE
// ========================================
export async function uploadSignature(file) {
    const filePath = `signatures/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
}

// ========================================
// UPLOAD QR CODE
// ========================================
export async function uploadQrCode(file) {
    const filePath = `qrcodes/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
}

// ========================================
// DELETE FILE
// ========================================
export async function deleteFile(filePath) {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) console.error("Error deleting file:", error);
}