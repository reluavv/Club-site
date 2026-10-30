import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/serverAuth";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getR2Config } from "@/lib/r2";

/**
 * Read-only capability check so the gallery UI can offer the R2 upload path
 * only when the server is actually configured for it. Reveals no credential
 * material — just a boolean and the missing variable names.
 */
export async function GET(request: Request) {
    const auth = await verifyAuthToken(request);
    if (!auth) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    try {
        const admin = (await getAdminFirestore().collection("admins").doc(auth.uid).get()).data();
        if (!admin || admin.status !== "active" || admin.role === "pending") {
            return NextResponse.json({ error: "Admins only." }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: "Admin verification is temporarily unavailable." }, { status: 503 });
    }

    const missing: string[] = [];
    for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_BASE_URL"]) {
        if (!process.env[k]) missing.push(k);
    }
    return NextResponse.json({ r2Configured: getR2Config() !== null, missingKeys: missing });
}
