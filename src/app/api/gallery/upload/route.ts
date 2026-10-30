import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/serverAuth";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
    getR2Config, sniffMedia, buildGalleryKey, uploadToR2, losslesslyOptimize,
    MAX_GALLERY_UPLOAD_BYTES,
} from "@/lib/r2";

/**
 * Server-side gallery upload to Cloudflare R2.
 *
 * Auth: Firebase ID token required; the caller must be an approved admin
 * (admins/{uid} with status=active and role != pending) — never client-checked.
 * Input: multipart/form-data { file, eventId }.
 * Images are stored losslessly recompressed where possible (PNG/AVIF -> WebP
 * lossless when smaller), JPEG/video/PDF are stored byte-for-byte unmodified.
 */
export async function POST(request: Request) {
    const auth = await verifyAuthToken(request);
    if (!auth) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    // Server-side admin authorization.
    let admin: any = null;
    try {
        admin = (await getAdminFirestore().collection("admins").doc(auth.uid).get()).data();
        if (!admin || admin.status !== "active" || admin.role === "pending") admin = null;
    } catch {
        return NextResponse.json({ error: "Admin verification is temporarily unavailable." }, { status: 503 });
    }
    if (!admin) return NextResponse.json({ error: "Only approved admins can upload gallery media." }, { status: 403 });

    const config = getR2Config();
    if (!config) return NextResponse.json({ error: "R2 is not configured on this server." }, { status: 503 });

    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    }
    const file = form.get("file");
    const eventId = form.get("eventId");
    if (!(file instanceof File) || typeof eventId !== "string" || !eventId.trim()) {
        return NextResponse.json({ error: "A file and eventId are required." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_GALLERY_UPLOAD_BYTES) {
        return NextResponse.json({ error: `File must be between 1 byte and ${Math.round(MAX_GALLERY_UPLOAD_BYTES / 1024 / 1024)} MB.` }, { status: 400 });
    }

    // Validate real content, not the browser-provided MIME type.
    const buf = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffMedia(buf, file.type);
    if (!sniffed) return NextResponse.json({ error: "Unsupported media type (jpg/png/gif/webp/avif/mp4/webm/pdf)." }, { status: 400 });

    // Lossless recompression where beneficial; the original for everything else.
    const optimized = await losslesslyOptimize(buf, sniffed.contentType);
    const key = buildGalleryKey(eventId.trim(), file.name.replace(/\.[^.]+$/, ""), optimized.ext);
    if (!key) return NextResponse.json({ error: "Invalid event reference." }, { status: 400 });

    try {
        const url = await uploadToR2(config, key, optimized.data, optimized.contentType);
        return NextResponse.json({
            url, key, contentType: optimized.contentType,
            originalSize: buf.length, storedSize: optimized.data.length,
            lossless: optimized.contentType === "image/webp" && optimized.contentType !== sniffed.contentType,
        });
    } catch (error) {
        console.error("R2 upload failed:", error);
        return NextResponse.json({ error: "Upload to storage failed. Please try again." }, { status: 500 });
    }
}
