import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { TeamMember } from "@/types";

const COLLECTION = "team_members";

export async function createTeamMember(data: Omit<TeamMember, "id" | "category">, category: "core" | "mentors" = "core") {
    return addDoc(collection(db, COLLECTION), {
        ...data,
        category,
        createdAt: Timestamp.now()
    });
}

export async function getTeamMembers(): Promise<TeamMember[]> {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
}

export async function updateTeamMember(id: string, data: Partial<TeamMember>) {
    const docRef = doc(db, COLLECTION, id);
    return updateDoc(docRef, data);
}

export async function deleteTeamMember(id: string) {
    const docRef = doc(db, COLLECTION, id);
    return deleteDoc(docRef);
}

export function subscribeToTeamMembers(callback: (members: TeamMember[]) => void) {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
        callback(members);
    });
}
