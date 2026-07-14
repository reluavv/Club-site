import { NextRequest } from 'next/server';

/**
 * Server-side Firebase Auth Token Verification Utility
 * 
 * Verifies Firebase ID tokens on API routes without requiring the Firebase Admin SDK.
 * Uses Google's public token info endpoint to validate tokens.
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

        // Verify the token using Google's tokeninfo endpoint
        // This validates the token's signature, expiry, and issuer
        const response = await fetch(
            `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            }
        );

        if (!response.ok) {
            console.warn('Token verification failed:', response.status);
            return null;
        }

        const data = await response.json();

        if (!data.users || data.users.length === 0) {
            return null;
        }

        const user = data.users[0];
        return {
            uid: user.localId,
            email: user.email,
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
