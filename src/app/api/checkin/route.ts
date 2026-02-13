import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const { eventId, userId, code } = await request.json();

        // Validate input
        if (!eventId || !userId || !code) {
            return NextResponse.json(
                { error: 'Missing required fields: eventId, userId, code' },
                { status: 400 }
            );
        }

        // 1. Fetch event to get the real attendance code (server-side only)
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        const eventData = eventSnap.data();

        // 2. Check if attendance is active
        if (!eventData.attendanceCode) {
            return NextResponse.json(
                { error: 'Attendance is not active for this event' },
                { status: 400 }
            );
        }

        // 3. Validate the code
        if (code !== eventData.attendanceCode) {
            return NextResponse.json(
                { error: 'Incorrect code. Please try again.' },
                { status: 403 }
            );
        }

        // 4. Verify the user is registered (Check Individual then Team)
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

        // 5. Mark as attended
        // If team event (or just to be safe), use attendance map for specific user
        // If individual event, we can also set global status, but map is more robust.
        // Let's do BOTH for individual (if maxTeamSize=1) or just Map?
        // To allow "EventsClient" to work without massive changes, we:
        // - If individual (no teamName), set status='attended' (preserves existing flow compatibility)
        // - If team, set attendance map.

        if (regData.teamName) {
            // Team: Use Map
            await setDoc(regRef, {
                attendance: { [userId]: true }
            }, { merge: true });
        } else {
            // Individual: Use Status (Legacy compatibility)
            await setDoc(regRef, { status: 'attended' }, { merge: true });
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
