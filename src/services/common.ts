import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { addDoc, collection, Timestamp, query, orderBy, limit, getDocs, writeBatch } from "firebase/firestore";
import { AuditLog } from "@/types"; // We will make sure this alias works or use relative path

// --- Image Upload API ---

export async function uploadImage(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
        const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    console.error("Error uploading image:", error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}

// Helper to extract storage path and delete file
export async function deleteFileByUrl(url: string | undefined | null) {
    if (!url) return;

    // Safety check: only delete files from our firebase storage
    if (!url.includes("firebasestorage.googleapis.com")) return;

    try {
        // Create a reference from the HTTPS URL directly
        // Firebase SDK handles parsing the URL to find the object location
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
        console.log(`Deleted file: ${url}`);
    } catch (error: any) {
        // Ignore "Object not found" errors (already deleted), throw others
        if (error.code === 'storage/object-not-found') {
            console.warn(`File not found (already deleted?): ${url}`);
            return;
        }
        console.error("Error deleting file from storage:", error);
        // We generally don't want to throw here to avoid blocking the main delete operation
    }
}

// Deprecated: Alias for backward compatibility if needed, or remove
export const deleteFile = deleteFileByUrl;

// --- Audit Logs ---

export async function logAuditAction(actorUid: string, actorName: string, action: string, details: any = {}) {
    try {
        await addDoc(collection(db, "audit_logs"), {
            action,
            actorUid,
            actorName,
            details,
            timestamp: Timestamp.now()
        });

        // Retention Policy: Keep only the latest 30 logs
        const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.size > 30) {
            const batch = writeBatch(db);
            const docsToDelete = snapshot.docs.slice(30);

            docsToDelete.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        }

    } catch (e) {
        console.error("Failed to log audit action", e);
    }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    try {
        const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(100));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    } catch (e) {
        console.warn("Failed to fetch audit logs", e);
        return [];
    }
}

// --- Utility / cleanup ---
export async function purgeCollection(collectionName: string): Promise<number> {
    const q = query(collection(db, collectionName), limit(500));
    const snapshot = await getDocs(q);
    const count = snapshot.size;

    if (count === 0) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    // Recurse if there might be more (since we limited to 500)
    if (count >= 500) {
        return count + await purgeCollection(collectionName);
    }

    return count;
}
