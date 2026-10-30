// Club roles are stored in Firestore (club_roles/{id}) and edited by the CTO under Manage Admins.
// Only the CTO role and the default Activator role are fixed in code, because logic depends on them.

export interface ClubRole {
    id: string;
    label: string;
    rank: number;          // display order, lowest first
    limit: number | null;  // seats; null means unlimited
}

export const CTO_ROLE: ClubRole = { id: "CTO", label: "Chief Technology Officer", rank: 7, limit: 1 };
export const DEFAULT_ROLE_ID = "Activator";

// Written to Firestore the first time the CTO opens Manage Admins, and used until then.
export const DEFAULT_ROLES: ClubRole[] = [
    { id: "Faculty", label: "Faculty Coordinator", rank: 1, limit: 2 },
    { id: "Mentor", label: "Mentor", rank: 2, limit: 3 },
    { id: "President", label: "President", rank: 3, limit: 1 },
    { id: "VP_AIML", label: "Vice President (AIML)", rank: 4, limit: 1 },
    { id: "VP_DSA", label: "Vice President (DSA)", rank: 4, limit: 1 },
    { id: "AdminHead", label: "Administrative Head", rank: 5, limit: 1 },
    { id: "PRHead", label: "PR Head", rank: 6, limit: 1 },
    { id: "Treasurer", label: "Treasurer", rank: 8, limit: 1 },
    { id: DEFAULT_ROLE_ID, label: "Activator", rank: 99, limit: null },
];

// Adds the CTO (never stored) and sorts by rank. Falls back to the defaults before the first save.
export function withBuiltIns(stored: ClubRole[]): ClubRole[] {
    const roles = stored.length ? stored : DEFAULT_ROLES;
    return [...roles.filter(r => r.id !== CTO_ROLE.id), CTO_ROLE].sort((a, b) => a.rank - b.rank);
}

export function roleLabel(roles: ClubRole[], id: string): string {
    return roles.find(r => r.id === id)?.label ?? id;
}

export function roleRank(roles: ClubRole[], id: string): number {
    return roles.find(r => r.id === id)?.rank ?? 999;
}

// "Events Lead" -> "Events_Lead". Ids never change after creation, so renaming a role keeps its holders.
export function roleIdFromLabel(label: string): string {
    return label.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
