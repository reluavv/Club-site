"use client";

import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, Timestamp, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { ContactMessage } from "@/types";

// --- Messages API ---

export async function saveMessage(data: Omit<ContactMessage, "id" | "timestamp">) {
    const docRef = await addDoc(collection(db, "messages"), {
        ...data,
        timestamp: Timestamp.now()
    });
    return docRef.id;
}

export async function getMessages(): Promise<ContactMessage[]> {
    try {
        const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ContactMessage));
    } catch (error) {
        console.warn("Firebase fetch failed (Messages):", error);
        return [];
    }
}

export function subscribeToMessages(callback: (messages: ContactMessage[]) => void) {
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ContactMessage));
        callback(messages);
    });
}

export async function deleteMessage(id: string) {
    await deleteDoc(doc(db, "messages", id));
}
