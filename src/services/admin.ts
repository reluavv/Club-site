import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, query, orderBy, where, onSnapshot, runTransaction, Timestamp, getCountFromServer } from "firebase/firestore";
import { AdminProfile, PendingRegistration } from "@/types";
import { logAuditAction } from "./common";
import { deleteUserData } from "./users";

// --- Constants ---
const TENURE_DURATION_MS = 2 * 365 * 24 * 60 * 60 * 1000; // 2 Years
// const TENURE_DURATION_MS = 2 * 60 * 1000; // 2 Minutes (Debug)

const ROLE_LIMITS: Record<string, number> = {
    "President": 1,
    "VP_AIML": 1,
    "VP_DSA": 1,
    "AdminHead": 1,
    "PRHead": 1,
    "CTO": 1,
    "Treasurer": 1,
    "Mentor": 3,
    "Faculty": 2,
    "Activator": Infinity
};

// --- Helpers ---

export async function checkRoleLimit(role: string): Promise<boolean> {
    const limit = ROLE_LIMITS[role];
    if (limit === undefined || limit === Infinity) return true;

    const q = query(collection(db, "admins"), where("role", "==", role), where("status", "==", "active"));
    const snapshot = await getCountFromServer(q);

    return snapshot.data().count < limit;
}

export async function checkTenure(admin: AdminProfile) {
    if (admin.role === "CTO") return; // Immune

    const startDate = admin.approvedAt || admin.createdAt;
    if (!startDate) return;

    const start = startDate.toDate().getTime();
    const now = Date.now();

    if (now - start > TENURE_DURATION_MS) {
        console.warn(`Tenure expired for ${admin.email}. Deleting account.`);
        await deleteUserData(admin.uid);
        await logAuditAction("SYSTEM", "System", "TENURE_EXPIRED", { targetUid: admin.uid, email: admin.email });
        // Force logout is handled by Auth listener detecting user deletion
        return true; // Deleted
    }
    return false; // Active
}

// --- Admin Management API (RBAC) ---

export async function createAdminProfile(uid: string, email: string) {
    await setDoc(doc(db, "admins", uid), {
        uid,
        email,
        role: "pending",
        createdAt: Timestamp.now()
    });
}

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
    try {
        const docRef = doc(db, "admins", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as AdminProfile;
        }
        return null;
    } catch (error) {
        console.warn("Error fetching admin profile:", error);
        return null;
    }
}

export async function getAllAdmins(): Promise<AdminProfile[]> {
    try {
        const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => doc.data() as AdminProfile);
    } catch (error) {
        console.warn("Error fetching all admins:", error);
        return [];
    }
}

export function subscribeToAllAdmins(callback: (admins: AdminProfile[]) => void) {
    const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const admins = snapshot.docs.map((doc) => doc.data() as AdminProfile);
        callback(admins);
    });
}

export async function isSystemInitialized(): Promise<boolean> {
    try {
        const snapshot = await getCountFromServer(collection(db, "admins"));
        return snapshot.data().count > 0;
    } catch (error) {
        console.warn("Error checking system initialization:", error);
        return false;
    }
}

// Updated to prevent exceeding limits
export async function updateAdminRole(uid: string, role: string, actorUid?: string, actorName?: string) {
    // 1. Check Limit
    if (!(await checkRoleLimit(role))) {
        throw new Error(`Role limit reached for ${role}. Cannot assign.`);
    }

    const updates: any = { role };
    // If promoting from pending/onboarding
    if (role !== "pending") {
        // Keep original approvedAt if exists, else set it
        // But usually we just update the role string here
    }

    await updateDoc(doc(db, "admins", uid), updates);

    if (actorUid) {
        await logAuditAction(actorUid, actorName || "Unknown", "UPDATE_ROLE", { targetUid: uid, newRole: role });
    }
}

export async function updateAdminProfileData(uid: string, data: Partial<AdminProfile>) {
    await updateDoc(doc(db, "admins", uid), data);
}

export async function deleteAdmin(uid: string) {
    await deleteUserData(uid);
}

// --- Doomsday (CTO Transfer) ---
export async function transferCTORole(currentCTOUid: string, targetEmail: string) {
    // This requires a transaction to be safe
    // 1. Find target user by email
    const adminsRef = collection(db, "admins");
    const q = query(adminsRef, where("email", "==", targetEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("Target admin not found");
    }

    const targetAdmin = querySnapshot.docs[0];
    const targetUid = targetAdmin.id;

    if (targetUid === currentCTOUid) {
        throw new Error("You cannot transfer role to yourself");
    }

    await runTransaction(db, async (transaction) => {
        // 2. Double check current user is still CTO (security)
        const currentAdminRef = doc(db, "admins", currentCTOUid);
        const currentAdminSnap = await transaction.get(currentAdminRef);
        if (currentAdminSnap.data()?.role !== "CTO") {
            throw new Error("You are not authorized to perform this action");
        }

        // 3. Update roles
        transaction.update(currentAdminRef, { role: "Mentor" }); // Old CTO becomes Mentor
        transaction.update(doc(db, "admins", targetUid), { role: "CTO" }); // New CTO
    });
}

// --- Pending Registrations (The "Dummy Table") ---

export async function createPendingRegistration(uid: string, email: string) {
    // We use the UID as the document ID so we can easily link it to the Auth user
    await setDoc(doc(db, "pending_registrations", uid), {
        email,
        requestedAt: Timestamp.now()
    });
}

export async function getPendingRegistrations(): Promise<PendingRegistration[]> {
    try {
        const q = query(collection(db, "pending_registrations"), orderBy("requestedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PendingRegistration));
    } catch (error) {
        console.warn("Error fetching pending registrations:", error);
        return [];
    }
}

export function subscribeToPendingRegistrations(callback: (regs: PendingRegistration[]) => void) {
    const q = query(collection(db, "pending_registrations"), orderBy("requestedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const regs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PendingRegistration));
        callback(regs);
    });
}

export async function approveRegistration(uid: string, actorUid?: string, actorName?: string) {
    // 1. Get the pending data
    const pendingRef = doc(db, "pending_registrations", uid);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) {
        throw new Error("Registration request not found");
    }

    const data = pendingSnap.data();

    // 2. Create the Admin Profile with 'onboarding' status
    // Default role is 'Activator' (No limit)
    await setDoc(doc(db, "admins", uid), {
        uid,
        email: data.email,
        role: "Activator",
        status: "onboarding",
        createdAt: data.requestedAt,
        approvedAt: Timestamp.now() // Tenure Starts Now
    });

    // 3. Delete from pending
    await deleteDoc(pendingRef);

    if (actorUid) {
        await logAuditAction(actorUid, actorName || "Unknown", "APPROVE_ADMIN", { targetUid: uid, email: data.email });
    }
}

export async function rejectRegistration(uid: string, actorUid?: string, actorName?: string) {
    // 1. Perform Full Data Wipe (Pending + User + Admin + Data)
    await deleteUserData(uid);

    // 2. Log Audit
    if (actorUid) {
        await logAuditAction(actorUid, actorName || "Unknown", "REJECT_ADMIN", { targetUid: uid });
    }
}

// --- Data Purge ---

import { writeBatch } from "firebase/firestore";

export async function purgeEventData(eventId: string) {
    // 1. Delete Registrations
    const regsQuery = query(collection(db, "registrations"), where("eventId", "==", eventId));
    const regsSnap = await getDocs(regsQuery);

    // 2. Delete Feedbacks
    const feedQuery = query(collection(db, "feedbacks"), where("eventId", "==", eventId));
    const feedSnap = await getDocs(feedQuery);

    const batch = writeBatch(db);

    regsSnap.docs.forEach((d) => batch.delete(d.ref));
    feedSnap.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
}

// --- Direct User Creation (Secondary App Pattern) ---
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

export async function createAdminDirectly(email: string, pass: string, role: string, actorUid?: string, actorName?: string) {
    // 0. Check Role Limit First
    if (!(await checkRoleLimit(role))) {
        throw new Error(`Role limit reached for ${role}. Cannot create.`);
    }

    // 1. Initialize secondary app to avoid logging out current user
    const secondaryApp = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }, "SecondaryApp");

    const secondaryAuth = getAuth(secondaryApp);

    try {
        // 2. Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        const user = userCredential.user;

        // 3. Create Admin Profile (Active immediately)
        await setDoc(doc(db, "admins", user.uid), {
            uid: user.uid,
            email,
            role,
            status: "active",
            createdAt: Timestamp.now(),
            approvedAt: Timestamp.now()
        });

        // 4. Log Audit
        if (actorUid) {
            await logAuditAction(actorUid, actorName || "Unknown", "CREATE_ADMIN_DIRECT", { targetUid: user.uid, email, role });
        }

        // 5. Cleanup
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        return user.uid;
    } catch (error) {
        // Cleanup on error too
        await deleteApp(secondaryApp);
        throw error;
    }
}

