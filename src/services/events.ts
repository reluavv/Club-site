import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, updateDoc, query, onSnapshot } from "firebase/firestore";
import { Event } from "@/types";
import { deleteFileByUrl } from "./common";
import { getEventGallery, deleteFromGallery } from "./gallery";

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
    try {
        // 1. Fetch Event to get image URL
        const eventDocRef = doc(db, "events", id);
        const eventSnap = await getDoc(eventDocRef);

        if (!eventSnap.exists()) return;
        const eventData = eventSnap.data() as Event;

        // 2. Delete all Gallery items associated with this event
        // We use deleteFromGallery because it now handles file deletion for each item
        const galleryImages = await getEventGallery(id);
        const galleryDeletePromises = galleryImages.map(img => deleteFromGallery(img.id));
        await Promise.all(galleryDeletePromises);

        // 3. Delete Event Cover Image
        if (eventData.image) {
            await deleteFileByUrl(eventData.image);
        }

        // 4. Delete Event Document
        await deleteDoc(eventDocRef);
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
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
