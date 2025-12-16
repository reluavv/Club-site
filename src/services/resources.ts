import { db } from "@/lib/firebase";
import { collection, doc, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { Resource } from "@/types";

// --- Resources API ---

export async function getResources(): Promise<Resource[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "resources"));
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resource));
    } catch (error) {
        console.warn("Firebase fetch failed (Resources):", error);
        return [];
    }
}

export async function createResource(resource: Omit<Resource, "id">) {
    const docRef = await addDoc(collection(db, "resources"), resource);
    return docRef.id;
}

export async function deleteResource(id: string) {
    await deleteDoc(doc(db, "resources", id));
}
