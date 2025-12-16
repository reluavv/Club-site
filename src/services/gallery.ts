import { db } from "@/lib/firebase";
import { collection, doc, getDocs, addDoc, deleteDoc, query, orderBy, Timestamp, where, onSnapshot } from "firebase/firestore";
import { GalleryImage } from "@/types";

// --- Gallery API ---

export async function getGallery(): Promise<GalleryImage[]> {
    try {
        const q = query(collection(db, "gallery"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GalleryImage));
    } catch (error) {
        console.warn("Firebase fetch failed (Gallery):", error);
        return [];
    }
}

export async function getEventGallery(eventId: string): Promise<GalleryImage[]> {
    try {
        const q = query(
            collection(db, "gallery"),
            where("eventId", "==", eventId)
            // Note: Add compound index in firebase if sorting by timestamp is needed
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GalleryImage));
        return docs.sort((a, b) => b.timestamp - a.timestamp); // Manual sort if index missing
    } catch (error) {
        console.warn("Firebase fetch failed (Event Gallery):", error);
        return [];
    }
}

export async function addToGallery(image: Omit<GalleryImage, "id" | "timestamp">) {
    const docRef = await addDoc(collection(db, "gallery"), {
        ...image,
        timestamp: Timestamp.now()
    });
    return docRef.id;
}

export async function deleteFromGallery(id: string) {
    await deleteDoc(doc(db, "gallery", id));
}

export function subscribeToEventGallery(eventId: string, callback: (images: GalleryImage[]) => void) {
    const q = query(collection(db, "gallery"), where("eventId", "==", eventId));
    return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GalleryImage));
        docs.sort((a, b) => b.timestamp - a.timestamp);
        callback(docs);
    });
}
