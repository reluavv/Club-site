import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/serverAuth';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin';

/**
 * DELETE /api/admin/delete-user?uid=<targetUid>
 * 
 * Deletes a Firebase Auth account. Only CTO can delete users.
 * Firestore data deletion is handled client-side via batch writes.
 */
export async function DELETE(request: Request) {
    try {
        // 1. Verify caller is authenticated
        const authResult = await verifyAuthToken(request);
        if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify caller is CTO (only CTO can permanently delete users)
        const adminDb = getAdminFirestore();
        const callerDoc = await adminDb.collection('admins').doc(authResult.uid).get();
        if (!callerDoc.exists || callerDoc.data()?.role !== 'CTO') {
            return NextResponse.json({ error: 'Forbidden — CTO role required' }, { status: 403 });
        }

        // 3. Get target UID from query params
        const url = new URL(request.url);
        const targetUid = url.searchParams.get('uid');
        if (!targetUid) {
            return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
        }

        // 4. Prevent self-deletion
        if (targetUid === authResult.uid) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // 5. Delete the Firebase Auth account
        await getAdminAuth().deleteUser(targetUid);

        return NextResponse.json({ success: true, message: `Auth account ${targetUid} deleted` });

    } catch (error: any) {
        // Handle "user not found" gracefully
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ success: true, message: 'Auth account already deleted' });
        }
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
