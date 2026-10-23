import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

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
