import { db } from "@/lib/firebase";
import {
    collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
    query, orderBy, onSnapshot, Timestamp
} from "firebase/firestore";
import { Alumni } from "@/types";

// --- CRUD Operations ---

export async function createAlumni(data: Omit<Alumni, "id" | "createdAt">) {
    const docRef = await addDoc(collection(db, "alumni"), {
        ...data,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateAlumni(id: string, data: Partial<Omit<Alumni, "id" | "createdAt">>) {
    await updateDoc(doc(db, "alumni", id), data);
}

export async function deleteAlumni(id: string) {
    await deleteDoc(doc(db, "alumni", id));
}

export async function getAlumni(): Promise<Alumni[]> {
    const q = query(collection(db, "alumni"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Alumni[];
}

// --- Real-time Subscription ---

export function subscribeToAlumni(callback: (alumni: Alumni[]) => void) {
    const q = query(collection(db, "alumni"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const alumni = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Alumni[];
        callback(alumni);
    });
}
