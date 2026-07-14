import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { verifyAuthToken } from '@/lib/serverAuth';

export async function POST(request: Request) {
    try {
        // 1. Verify Firebase Auth token — extract userId from verified token
        const authResult = await verifyAuthToken(request);
        if (!authResult) {
            return NextResponse.json(
                { error: 'Unauthorized — valid authentication required' },
                { status: 401 }
            );
        }

        // userId comes from the verified token, NOT the request body
        const userId = authResult.uid;

        const { eventId, code } = await request.json();

        // Validate input
        if (!eventId || !code) {
            return NextResponse.json(
                { error: 'Missing required fields: eventId, code' },
                { status: 400 }
            );
        }

        // 2. Fetch event to get the real attendance code (server-side only)
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        const eventData = eventSnap.data();

        // 3. Check if attendance is active
        if (!eventData.attendanceCode) {
            return NextResponse.json(
                { error: 'Attendance is not active for this event' },
                { status: 400 }
            );
        }

        // 4. Validate the code
        if (code !== eventData.attendanceCode) {
            return NextResponse.json(
                { error: 'Incorrect code. Please try again.' },
                { status: 403 }
            );
        }

        // 5. Verify the user is registered (Check Individual then Team)
        let regRef;
        let regData;

        // A. Direct Individual Registration
        const individualRegRef = doc(db, 'registrations', `${eventId}_${userId}`);
        const individualSnap = await getDoc(individualRegRef);

        if (individualSnap.exists()) {
            regRef = individualRegRef;
            regData = individualSnap.data();
        } else {
            // B. Team Membership Check
            const q = query(
                collection(db, "registrations"),
                where("eventId", "==", eventId),
                where("participantIds", "array-contains", userId)
            );
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
                // Only take the first one (user shouldn't be in multiple teams for same event)
                regRef = querySnap.docs[0].ref;
                regData = querySnap.docs[0].data();
            }
        }

        if (!regRef || !regData) {
            return NextResponse.json(
                { error: 'You are not registered for this event' },
                { status: 403 }
            );
        }

        // Check if ALREADY checked in
        // Support both "status" (legacy/individual) and "attendance" map (team/new)
        const hasIndividualStatus = regData.status === 'attended';
        const hasMapStatus = regData.attendance && regData.attendance[userId];

        if (hasIndividualStatus || hasMapStatus) {
            return NextResponse.json(
                { error: 'You have already checked in' },
                { status: 400 }
            );
        }

        // 6. Mark as attended
        if (regData.teamName) {
            // Team: Use Map
            await setDoc(regRef, {
                attendance: { [userId]: true }
            }, { merge: true });
        } else {
            // Individual: Use Status (Legacy) AND Map (Future-proof/Consistency)
            await setDoc(regRef, {
                status: 'attended',
                attendance: { [userId]: true }
            }, { merge: true });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Check-in error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
