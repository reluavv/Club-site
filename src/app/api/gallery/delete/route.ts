import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/serverAuth";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getR2Config, deleteFromR2, validateGalleryKey } from "@/lib/r2";

/**
 * Deletes a gallery object from R2. Admin-only server check, and the key must
 * match our gallery/<eventId>/... namespace so no other part of the bucket can
 * be reached.
 */
export async function POST(request: Request) {
    const auth = await verifyAuthToken(request);
    if (!auth) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    try {
        const admin = (await getAdminFirestore().collection("admins").doc(auth.uid).get()).data();
        if (!admin || admin.status !== "active" || admin.role === "pending") {
            return NextResponse.json({ error: "Only approved admins can delete gallery media." }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: "Admin verification is temporarily unavailable." }, { status: 503 });
    }

    const config = getR2Config();
    if (!config) return NextResponse.json({ error: "R2 is not configured on this server." }, { status: 503 });

    const body = await request.json().catch(() => null);
    const key = typeof body?.key === "string" ? body.key : "";
    if (!key || !validateGalleryKey(key)) {
        return NextResponse.json({ error: "Invalid object key." }, { status: 400 });
    }

    try {
        await deleteFromR2(config, key);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("R2 delete failed:", error);
        return NextResponse.json({ error: "Deletion from storage failed." }, { status: 500 });
    }
}
