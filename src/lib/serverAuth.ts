import { NextRequest } from 'next/server';

/**
 * Server-side Firebase Auth Token Verification Utility
 * 
 * Verifies Firebase ID tokens on API routes using the Firebase Admin SDK.
 * This properly validates the JWT signature, audience, issuer, and expiry
 * against Google's public keys.
 * 
 * Usage:
 *   const authResult = await verifyAuthToken(request);
 *   if (!authResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   // authResult.uid is the verified user's Firebase UID
 */

interface AuthResult {
    uid: string;
    email?: string;
}

/**
 * Extracts and verifies a Firebase ID token from the Authorization header.
 * Returns the decoded user info (uid, email) or null if invalid/missing.
 */
export async function verifyAuthToken(request: Request | NextRequest): Promise<AuthResult | null> {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const idToken = authHeader.split('Bearer ')[1];
        if (!idToken || idToken.trim() === '') {
            return null;
        }

        // Verify the token using Firebase Admin SDK
        // This cryptographically validates: JWT signature, aud, iss, exp, iat, sub
        const { getAdminAuth } = await import('@/lib/firebaseAdmin');
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
    } catch (error) {
        console.error('Auth token verification error:', error);
        return null;
    }
}
