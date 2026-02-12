import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, Timestamp, writeBatch, collection, query, where, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "@/types";

// --- Public User API ---

export async function createUserProfile(uid: string, email: string) {
    const randomAvatar = await getRandomDefaultAvatar();
    const userProfile: UserProfile = {
        uid,
        email,
        photoURL: randomAvatar,
        isVerified: false,
        createdAt: Timestamp.now()
    };
    await setDoc(doc(db, "users", uid), userProfile);
}

// Helper to get a random avatar
async function getRandomDefaultAvatar(): Promise<string> {
    try {
        // Fetch available avatars from API
        const response = await fetch('/api/avatars');
        if (!response.ok) return getDefaultFallbackAvatar();

        const avatarsMap = await response.json();
        const categories = Object.keys(avatarsMap);

        if (categories.length === 0) return getDefaultFallbackAvatar();

        // Pick random category
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const avatars = avatarsMap[randomCategory];

        if (!avatars || avatars.length === 0) return getDefaultFallbackAvatar();

        // Pick random avatar from category
        return avatars[Math.floor(Math.random() * avatars.length)];
    } catch (error) {
        console.warn("Failed to fetch random avatar:", error);
        return getDefaultFallbackAvatar();
    }
}

function getDefaultFallbackAvatar(): string {
    // Fallback if API fails - pointing to a safe default if exists, or just a placeholder
    // Assuming we have at least these after generation
    return '/avatars/robot/robot_01.jpeg';
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.warn("Error fetching user profile:", error);
        return null;
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    await setDoc(doc(db, "users", uid), data, { merge: true });
}

// --- Tenure Check (3 Years for Public Users) ---
const PUBLIC_TENURE_MS = 3 * 365 * 24 * 60 * 60 * 1000; // 3 Years

export async function checkUserTenure(user: UserProfile) {
    if (!user.createdAt) return false;

    const start = user.createdAt.toDate().getTime();
    const now = Date.now();

    if (now - start > PUBLIC_TENURE_MS) {
        console.warn(`Public tenure expired for ${user.email}. Deleting account.`);
        await deleteUserData(user.uid);
        return true; // Deleted
    }
    return false; // Active
}

// --- Data Purge (Identity Only) ---
export async function deleteUserData(uid: string) {
    const batch = writeBatch(db);

    // 1. Delete User Profile
    const userRef = doc(db, "users", uid);
    batch.delete(userRef);

    // 2. Delete Admin Profile (if exists)
    const adminRef = doc(db, "admins", uid);
    batch.delete(adminRef);

    // 3. Delete Pending Registration (if exists)
    const pendingRef = doc(db, "pending_registrations", uid);
    batch.delete(pendingRef);

    // Note: Registrations and Feedback are PRESERVED as per request.
    // They will remain as historical records (possibly with broken user links, which is acceptable).

    // Commit all deletes
    await batch.commit();
}

export function subscribeToTotalUsers(callback: (count: number) => void) {
    const q = query(collection(db, "users"));
    // Note: onSnapshot downloads document metadata. optimize if scaling needed.
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
    });
}
