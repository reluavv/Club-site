import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { TeamInvitation, StudentSearchResult, AvailableTeam } from "@/types";
import { callRegistrationsApi } from "./registrations";

// --- Search Students ---
// Runs on the server: students cannot read other students' profiles.
export async function searchStudents(searchTerm: string): Promise<StudentSearchResult[]> {
    if (!searchTerm || searchTerm.trim().length < 2) return [];
    const { students } = await callRegistrationsApi<{ students: StudentSearchResult[] }>("searchStudents", { term: searchTerm });
    return students;
}

// --- Send Invitation (leader -> student). One pending invitation per student per event. ---
export async function sendInvitation(eventId: string, targetUserId: string): Promise<void> {
    await callRegistrationsApi("invite", { eventId, targetUserId });
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

// --- Respond to an invitation (student) or a join request (leader) ---
export async function respondToInvitation(
    invitationId: string,
    response: 'accepted' | 'rejected'
): Promise<void> {
    await callRegistrationsApi("respond", { invitationId, response });
}

// --- Join Request Functions ---

export async function getAvailableTeams(eventId: string): Promise<AvailableTeam[]> {
    const { teams } = await callRegistrationsApi<{ teams: AvailableTeam[] }>("availableTeams", { eventId });
    return teams;
}

export async function requestToJoinTeam(eventId: string, registrationId: string) {
    await callRegistrationsApi("requestJoin", { eventId, registrationId });
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
