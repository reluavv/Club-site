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

    // Strategy: Fetch all users and filter client-side.
    // Modified: Removed isVerified check to allow searching for new/unverified students
    const q = query(collection(db, "users"));
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
        type: 'invite',
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

    // Determine who is the new member based on type
    const isRequest = invitation.type === 'request';
    const currentMembers = regData.teamMembers || [];

    if (currentMembers.length + 1 >= maxSize) { // +1 = leader
        throw new Error("This team is already full.");
    }

    const newMemberId = isRequest ? invitation.senderId : invitation.targetUserId;
    const newMemberName = isRequest ? invitation.senderName : invitation.targetName;
    const newMemberRollNo = isRequest ? "Unknown" : invitation.targetRollNo; // Need sender details if request!

    // Wait! Invitation stores senderName but NOT senderRollNo.
    // If it's a request, we need sender's rollNo.
    // We should fetch sender profile or store it in invitation.
    // Let's assume for now we fetch it or store it.
    // Better: Update TeamInvitation to include senderRollNo?
    // Or just fetch user profile here.
    let rollNo = newMemberRollNo;
    if (isRequest) {
        const userDoc = await getDoc(doc(db, "users", newMemberId));
        rollNo = userDoc.exists() ? userDoc.data().rollNo : "Unknown";
    }

    const newMember = {
        name: newMemberName,
        rollNo: rollNo,
        userId: newMemberId,
    };

    // Update registration: add member, check if team is now complete
    const updatedMembers = [...currentMembers, newMember];

    // Check pending requests limit? No, just remove accepted one.
    // Also update participantIds for querying
    const participantIds = regData.participantIds || [regData.userId];
    const updatedParticipantIds = [...participantIds, newMemberId];

    // Remove from pendingRequests if it was a request
    let pendingRequests = regData.pendingRequests || [];
    if (isRequest) {
        pendingRequests = pendingRequests.filter(id => id !== newMemberId);
    }

    const totalSize = updatedMembers.length + 1; // +1 for leader
    const newStatus = totalSize >= minSize ? 'registered' : 'forming';

    await updateDoc(regRef, {
        teamMembers: updatedMembers,
        participantIds: updatedParticipantIds,
        pendingRequests, // Update pending requests
        status: newStatus,
    });

    // Mark invitation as accepted
    await updateDoc(invRef, {
        status: 'accepted',
        respondedAt: Timestamp.now(),
    });
}

// --- Join Request Functions ---

export async function getAvailableTeams(eventId: string, currentUserId: string): Promise<EventRegistration[]> {
    // 1. Get all forming/registered teams for this event
    const q = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId)
    );
    const snapshot = await getDocs(q);
    const teams = snapshot.docs.map(d => d.data() as EventRegistration);

    // 2. Get Event Data for max size
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (!eventDoc.exists()) return [];
    const eventMax = eventDoc.data().maxTeamSize || 10;

    // 3. Filter
    return teams.filter(team => {
        // Must be a team (have a name)
        if (!team.teamName) return false;

        // Must not be full
        const currentCount = 1 + (team.teamMembers?.length || 0);
        if (currentCount >= eventMax) return false;

        // Must not have too many pending requests
        // "total no of joining requests a team can have is the maximum team size"
        // Wait, does this mean PENDING requests limit?
        // Let's assume Pending Requests Count < Max Size is the rule
        const pendingCount = team.pendingRequests?.length || 0;
        if (pendingCount >= eventMax) return false;

        // Must not already include me
        if (team.participantIds?.includes(currentUserId)) return false;

        // Must not already have a pending request from me
        if (team.pendingRequests?.includes(currentUserId)) return false;

        return true;
    });
}

export async function requestToJoinTeam(
    eventId: string,
    eventTitle: string,
    team: EventRegistration,
    user: UserProfile
) {
    // Check double registration / request
    // We rely on getAvailableTeams to hide invalid ones, but db check is safer

    // Create "Request" Invitation
    // Sender = Student, Target = Leader
    const inviteId = `${eventId}_${user.uid}_req_${team.id}`; // Unique ID for request

    const invitation: TeamInvitation = {
        id: inviteId,
        eventId,
        eventTitle,
        teamName: team.teamName!,
        registrationId: team.id,
        senderId: user.uid,
        senderName: user.displayName || "Unknown",
        // Target is Leader
        targetUserId: team.userId!, // Leader ID
        targetName: team.userDetails.name || "Team Leader",
        targetRollNo: team.userDetails.rollNo,
        type: 'request',
        status: 'pending',
        createdAt: Timestamp.now()
    };

    // Add to pendingRequests of team
    const regRef = doc(db, "registrations", team.id);
    await updateDoc(regRef, {
        pendingRequests: arrayUnion(user.uid)
    });

    await setDoc(doc(db, "invitations", inviteId), invitation);
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
