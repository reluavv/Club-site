import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, query, Timestamp, where, onSnapshot } from "firebase/firestore";
import { GalleryImage } from "@/types";
import { deleteFileByUrl } from "./storage";

// --- Gallery API ---

/**
 * Uploads one gallery item to Cloudflare R2 through the secure server route.
 * Returns { url, key } on success. Requires an approved admin token; the
 * route enforces that server-side and never exposes R2 credentials.
 */
export async function uploadGalleryToR2(
    file: File,
    eventId: string,
    onProgress?: (pct: number) => void,
): Promise<{ url: string; key: string; storedSize?: number; lossless?: boolean }> {
    const { getAuthToken } = await import("@/lib/authHeaders");
    const token = await getAuthToken();
    if (!token) throw new Error("Not signed in");

    // XHR (not fetch) so upload progress can be reported to the UI.
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const data = new FormData();
        data.append("file", file);
        data.append("eventId", eventId);
        xhr.open("POST", "/api/gallery/upload");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (onProgress) {
            xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
        }
        xhr.onload = () => {
            try {
                const json = JSON.parse(xhr.responseText || "{}");
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({
                        url: json.url,
                        key: json.key,
                        storedSize: json.storedSize,
                        lossless: !!json.lossless,
                    });
                } else reject(new Error(json.error || `Upload failed (${xhr.status})`));
            } catch {
                reject(new Error(`Upload failed (${xhr.status})`));
            }
        };
        xhr.onerror = () => reject(new Error("Upload failed – network error"));
        xhr.send(data);
    });
}

/** One-shot capability check so the UI knows whether R2 uploads are available. */
export async function checkR2Configured(): Promise<{ r2Configured: boolean; missingKeys?: string[] }> {
    const { getAuthHeaders } = await import("@/lib/authHeaders");
    const headers = await getAuthHeaders();
    if (!headers) return { r2Configured: false };
    try {
        const res = await fetch("/api/gallery/status", { headers });
        if (!res.ok) return { r2Configured: false };
        return await res.json();
    } catch {
        return { r2Configured: false };
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
    try {
        const docRef = doc(db, "gallery", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as GalleryImage;
            if (data.storageKey) {
                // R2 objects are removed by the server route that holds the
                // storage credentials; it validates admin identity and the key.
                const { getAuthHeaders } = await import("@/lib/authHeaders");
                const headers = await getAuthHeaders();
                if (headers) {
                    const res = await fetch("/api/gallery/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...headers },
                        body: JSON.stringify({ key: data.storageKey }),
                    });
                    if (!res.ok) throw new Error(`R2 delete failed (${res.status})`);
                }
            } else {
                // Legacy items live in Firebase Storage.
                await deleteFileByUrl(data.src);
            }
        }

        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting gallery item:", error);
        throw error;
    }
}

export function subscribeToEventGallery(eventId: string, callback: (images: GalleryImage[]) => void) {
    const q = query(collection(db, "gallery"), where("eventId", "==", eventId));
    return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GalleryImage));
        docs.sort((a, b) => b.timestamp - a.timestamp);
        callback(docs);
    });
}
