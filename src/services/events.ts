import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, updateDoc, query, onSnapshot } from "firebase/firestore";
import { Event } from "@/types";

// --- Events API ---

export async function getEvents(): Promise<Event[]> {
    try {
        const q = query(collection(db, "events")); // You might want to order by date here
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
        console.warn("Firebase fetch failed (Events):", error);
        return [];
    }
}

export function subscribeToEvents(callback: (events: Event[]) => void) {
    const q = query(collection(db, "events"));
    return onSnapshot(q, (snapshot) => {
        const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
        callback(events);
    });
}

export async function createEvent(event: Omit<Event, "id">) {
    const docRef = await addDoc(collection(db, "events"), event);
    return docRef.id;
}

export async function deleteEvent(id: string) {
    await deleteDoc(doc(db, "events", id));
}

export async function getEvent(id: string): Promise<Event | null> {
    try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Event;
        }
        return null;
    } catch (error) {
        console.warn("Error fetching event:", error);
        return null;
    }
}

export async function updateEvent(id: string, data: Partial<Event>) {
    await updateDoc(doc(db, "events", id), data);
}

export function subscribeToEvent(id: string, callback: (event: Event | null) => void) {
    const docRef = doc(db, "events", id);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as Event);
        } else {
            callback(null);
        }
    });
}
