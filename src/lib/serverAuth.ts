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

/**
 * Helper to get the current user's ID token on the client side.
 * Call this before making authenticated API requests.
 * 
 * Usage (client-side):
 *   import { getAuthToken } from '@/lib/serverAuth';
 *   const token = await getAuthToken();
 *   fetch('/api/endpoint', { headers: { Authorization: `Bearer ${token}` } });
 */
export async function getAuthToken(): Promise<string | null> {
    // This function is meant to be called from client-side code
    // It dynamically imports Firebase auth to get the current user's token
    if (typeof window === 'undefined') return null;

    try {
        const { auth } = await import('@/lib/firebase');
        const user = auth.currentUser;
        if (!user) return null;
        return await user.getIdToken();
    } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
    }
}

/**
 * Creates the Authorization header object for authenticated API calls.
 * Returns null if no user is logged in.
 * 
 * Usage (client-side):
 *   const authHeaders = await getAuthHeaders();
 *   if (!authHeaders) { handle unauthorized }
 *   fetch('/api/endpoint', { headers: { 'Content-Type': 'application/json', ...authHeaders } });
 */
export async function getAuthHeaders(): Promise<Record<string, string> | null> {
    const token = await getAuthToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
}
