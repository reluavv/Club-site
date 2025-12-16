import { db } from "@/lib/firebase";
import { collection, doc, getDocs, setDoc, query, where, orderBy, Timestamp, getDoc } from "firebase/firestore";
import { EventRegistration, UserProfile } from "@/types";

// --- Registration API ---

export async function registerForEvent(
    eventId: string,
    userId: string,
    userDetails: UserProfile,
    teamDetails?: { teamName: string; teamMembers: any[] }
) {
    // 1. Check for existing registration
    const q = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId),
        where("userId", "==", userId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
        throw new Error("You are already registered for this event.");
    }

    // 2. Validate Profile (Safety check)
    if (!userDetails.rollNo || !userDetails.mobile) {
        throw new Error("Complete your profile before registering.");
    }

    // Auto-Close Check
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (!eventDoc.exists()) throw new Error("Event not found");
    const eventData = eventDoc.data();

    if (eventData.registrationStatus !== 'open') throw new Error("Registrations are closed.");

    const eventDate = new Date(eventData.date);
    const now = new Date();
    if (now >= eventDate) {
        throw new Error("Registrations have closed for this event.");
    }

    // 3. Create Registration ID (Composite key for easy checking)
    const regId = `${eventId}_${userId}`;

    // 4. Team Validation: unique participants check
    // If it's a team registration, we must ensure NONE of the members are already registered in other teams.
    if (teamDetails && teamDetails.teamMembers.length > 0) {
        // Fetch ALL registrations for this event to check for duplicates
        // Optimization: In a huge scale app, we'd use a separate collection "event_participants" with rollNo as key.
        // For this scale, scanning registration docs (usually < 500) is acceptable or we rely on client integrity + basic checks.
        // Let's do a reliable check:
        const allRegsSnapshot = await getDocs(query(collection(db, "registrations"), where("eventId", "==", eventId)));

        const newTeamRollNos = new Set(teamDetails.teamMembers.map(m => m.rollNo.trim().toUpperCase()));

        for (const docSnap of allRegsSnapshot.docs) {
            const reg = docSnap.data() as EventRegistration;

            // Check main user
            if (newTeamRollNos.has(reg.userDetails.rollNo.trim().toUpperCase())) {
                throw new Error(`Participant ${reg.userDetails.rollNo} is already registered.`);
            }

            // Check their team members if any
            if (reg.teamMembers) {
                for (const member of reg.teamMembers) {
                    if (newTeamRollNos.has(member.rollNo.trim().toUpperCase())) {
                        throw new Error(`Participant ${member.rollNo} is already registered in team '${reg.teamName}'.`);
                    }
                }
            }
        }
    }

    const registration: EventRegistration = {
        id: regId,
        eventId,
        userId,
        userDetails: {
            name: userDetails.displayName || "Unknown",
            rollNo: userDetails.rollNo,
            class: userDetails.class || "Unknown",
            section: userDetails.section || "Unknown",
            mobile: userDetails.mobile
        },
        registeredAt: Timestamp.now(),
        status: 'registered',
        ...(teamDetails && {
            teamName: teamDetails.teamName,
            teamMembers: teamDetails.teamMembers
        })
    };

    await setDoc(doc(db, "registrations", regId), registration);
    return regId;
}

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    try {
        const q = query(
            collection(db, "registrations"),
            where("eventId", "==", eventId)
            // Note: orderBy might require a composite index with the where clause
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as EventRegistration);
    } catch (error) {
        console.warn("Error fetching event registrations:", error);
        return [];
    }
}

export async function checkRegistrationStatus(eventId: string, userId: string): Promise<EventRegistration | null> {
    const docRef = doc(db, "registrations", `${eventId}_${userId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as EventRegistration;
    }
    return null;
}

export async function checkInUser(eventId: string, userId: string) {
    const regId = `${eventId}_${userId}`;
    await setDoc(doc(db, "registrations", regId), { status: 'attended' }, { merge: true });
}

import { Feedback, Event } from "@/types";
import { runTransaction } from "firebase/firestore";

export async function submitFeedback(feedback: Feedback) {
    const regId = `${feedback.eventId}_${feedback.userId}`;
    const eventRef = doc(db, "events", feedback.eventId);
    const regRef = doc(db, "registrations", regId);

    // Use transaction to ensure data integrity
    await runTransaction(db, async (transaction) => {
        // 1. Get Event to calculate new rating
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) throw "Event does not exist!";
        const eventData = eventDoc.data() as Event;

        const currentRating = eventData.avgRating || 0;
        const count = eventData.feedbackCount || 0;

        // New Average = ((Current * Count) + New) / (Count + 1)
        // Note: feedback.overallRating is 5-star
        const newCount = count + 1;
        const newAvg = ((currentRating * count) + feedback.overallRating) / newCount;

        // 2. Write Feedback Doc
        const feedbackRef = doc(collection(db, "feedbacks")); // Auto ID
        transaction.set(feedbackRef, feedback);

        // 3. Update Event Stats
        transaction.update(eventRef, {
            avgRating: newAvg,
            feedbackCount: newCount
        });

        // 4. Mark Registration as Feedback Submitted
        transaction.update(regRef, {
            feedbackSubmitted: true
        });
    });
}
