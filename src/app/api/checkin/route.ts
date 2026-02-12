import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

        // 4. Verify the user is registered
        const regId = `${eventId}_${userId}`;
        const regRef = doc(db, 'registrations', regId);
        const regSnap = await getDoc(regRef);

        if (!regSnap.exists()) {
            return NextResponse.json(
                { error: 'You are not registered for this event' },
                { status: 403 }
            );
        }

        const regData = regSnap.data();

        if (regData.status === 'attended') {
            return NextResponse.json(
                { error: 'You have already checked in' },
                { status: 400 }
            );
        }

        // 5. Mark as attended
        await setDoc(regRef, { status: 'attended' }, { merge: true });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Check-in error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
