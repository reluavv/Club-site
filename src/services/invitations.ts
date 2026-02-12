import { db } from "@/lib/firebase";
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, onSnapshot, Timestamp, arrayUnion
} from "firebase/firestore";
import { TeamInvitation, UserProfile, EventRegistration } from "@/types";
import { checkRegistrationStatus } from "./registrations";

// --- Search Students ---
// Searches the 'users' collection by displayName or rollNo (case-insensitive prefix match)
export async function searchStudents(searchTerm: string): Promise<UserProfile[]> {
    if (!searchTerm || searchTerm.trim().length < 2) return [];

    const term = searchTerm.trim();
    const termUpper = term.toUpperCase();
    const termLower = term.toLowerCase();

    // Firestore doesn't support full-text search natively.
    // Strategy: Fetch all verified users and filter client-side.
    // For <5000 users this is acceptable. For scale, use Algolia/Typesense.
    const q = query(collection(db, "users"), where("isVerified", "==", true));
    const snapshot = await getDocs(q);

    const results: UserProfile[] = [];
    snapshot.forEach((doc) => {
        const user = doc.data() as UserProfile;
        const nameMatch = user.displayName?.toLowerCase().includes(termLower);
        const rollMatch = user.rollNo?.toUpperCase().includes(termUpper);

        if (nameMatch || rollMatch) {
            results.push(user);
        }
    });

    return results.slice(0, 20); // Cap at 20 results
}

// --- Send Invitation ---
// Creates an invitation doc. One pending invitation per student per event.
export async function sendInvitation(data: {
    eventId: string;
    eventTitle: string;
    teamName: string;
    senderId: string;
    senderName: string;
    targetUserId: string;
    targetName: string;
    targetRollNo: string;
}): Promise<void> {
    const inviteId = `${data.eventId}_${data.targetUserId}`;
    const registrationId = `${data.eventId}_${data.senderId}`;

    // Check if target already has an active invitation or is already registered
    const existingDoc = await getDoc(doc(db, "invitations", inviteId));
    if (existingDoc.exists()) {
        const existing = existingDoc.data() as TeamInvitation;
        if (existing.status === 'accepted') {
            throw new Error("This student is already on a team for this event.");
        }
        if (existing.status === 'pending') {
            throw new Error("This student already has a pending invitation for this event.");
        }
        // If 'rejected', we can overwrite with the new invitation
    }

    // Check if user is already registered (leader or member)
    const existingRegistration = await checkRegistrationStatus(data.eventId, data.targetUserId);
    if (existingRegistration) {
        throw new Error("This student is already registered for this event.");
    }

    const invitation: TeamInvitation = {
        id: inviteId,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        teamName: data.teamName,
        registrationId,
        senderId: data.senderId,
        senderName: data.senderName,
        targetUserId: data.targetUserId,
        targetName: data.targetName,
        targetRollNo: data.targetRollNo,
        status: 'pending',
        createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, "invitations", inviteId), invitation);
}

// --- Get Pending Invitations for a User (Real-time) ---
export function subscribeToMyInvitations(
    userId: string,
    callback: (invitations: TeamInvitation[]) => void
) {
    const q = query(
        collection(db, "invitations"),
        where("targetUserId", "==", userId),
        where("status", "==", "pending")
    );

    return onSnapshot(q, (snapshot) => {
        const invitations = snapshot.docs.map(d => d.data() as TeamInvitation);
        callback(invitations);
    });
}

// --- Respond to Invitation ---
export async function respondToInvitation(
    invitationId: string,
    response: 'accepted' | 'rejected'
): Promise<void> {
    const invRef = doc(db, "invitations", invitationId);
    const invSnap = await getDoc(invRef);

    if (!invSnap.exists()) {
        throw new Error("Invitation not found.");
    }

    const invitation = invSnap.data() as TeamInvitation;

    if (invitation.status !== 'pending') {
        throw new Error("This invitation has already been responded to.");
    }

    if (response === 'rejected') {
        // Delete the doc so another leader can invite this student
        await deleteDoc(invRef);
        return;
    }

    // ACCEPTED: Add this member to the team's registration doc
    const regRef = doc(db, "registrations", invitation.registrationId);
    const regSnap = await getDoc(regRef);

    if (!regSnap.exists()) {
        throw new Error("The team registration no longer exists.");
    }

    const regData = regSnap.data() as EventRegistration;

    // Get the event to check max team size
    const eventRef = doc(db, "events", invitation.eventId);
    const eventSnap = await getDoc(eventRef);
    const eventData = eventSnap.exists() ? eventSnap.data() : null;
    const maxSize = eventData?.maxTeamSize || 10;
    const minSize = eventData?.minTeamSize || 1;

    const currentMembers = regData.teamMembers || [];
    if (currentMembers.length + 1 >= maxSize) { // +1 = leader
        throw new Error("This team is already full.");
    }

    // Add member to team
    const newMember = {
        name: invitation.targetName,
        rollNo: invitation.targetRollNo,
        userId: invitation.targetUserId,
    };

    // Update registration: add member, check if team is now complete
    const updatedMembers = [...currentMembers, newMember];
    const totalSize = updatedMembers.length + 1; // +1 for leader
    const newStatus = totalSize >= minSize ? 'registered' : 'forming';

    // Also update participantIds for querying
    const participantIds = regData.participantIds || [regData.userId];
    const updatedParticipantIds = [...participantIds, invitation.targetUserId];

    await updateDoc(regRef, {
        teamMembers: updatedMembers,
        participantIds: updatedParticipantIds,
        status: newStatus,
    });

    // Mark invitation as accepted
    await updateDoc(invRef, {
        status: 'accepted',
        respondedAt: Timestamp.now(),
    });
}

// --- Get Invitations Sent by a Leader for a Specific Event ---
export function subscribeToTeamInvitations(
    eventId: string,
    senderId: string,
    callback: (invitations: TeamInvitation[]) => void
) {
    const registrationId = `${eventId}_${senderId}`;
    const q = query(
        collection(db, "invitations"),
        where("registrationId", "==", registrationId)
    );

    return onSnapshot(q, (snapshot) => {
        const invitations = snapshot.docs.map(d => d.data() as TeamInvitation);
        callback(invitations);
    });
}

// --- Check if a student has a pending/accepted invite for an event ---
export async function getStudentInviteStatus(
    eventId: string,
    targetUserId: string
): Promise<'pending' | 'accepted' | 'available'> {
    const inviteId = `${eventId}_${targetUserId}`;
    const invSnap = await getDoc(doc(db, "invitations", inviteId));

    if (!invSnap.exists()) return 'available';

    const data = invSnap.data() as TeamInvitation;
    return data.status === 'pending' ? 'pending' : data.status === 'accepted' ? 'accepted' : 'available';
}
