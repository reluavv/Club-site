import { auth } from "./firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "firebase/auth";
import { useEffect, useState } from "react";
import { createAdminProfile, getAdminProfile, AdminProfile, checkTenure } from "./api";

// --- Auth Actions ---

export async function signIn(email: string, pass: string) {
    try {
        return await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        console.error("Login failed:", error.code, error.message);
        throw error;
    }
}

export async function signUp(email: string, pass: string) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        // Create user profile in Firestore
        await createAdminProfile(userCredential.user.uid, email);
        return userCredential.user;
    } catch (error: any) {
        console.error("Signup failed:", error.code, error.message);
        throw error;
    }
}

export async function signOut() {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

// --- Auth Hook ---

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // 1. Try Admin Profile
                const adminProfile = await getAdminProfile(currentUser.uid);

                if (adminProfile) {
                    // Check Admin Tenure (2 Years except CTO)
                    const isExpired = await checkTenure(adminProfile);
                    if (isExpired) {
                        await signOut();
                        setProfile(null);
                        setUser(null);
                        alert("Your admin tenure has ended (2 Years). Thank you for your service.");
                    } else {
                        setProfile(adminProfile);
                    }
                } else {
                    // 2. Try Public User Profile
                    // We need to dynamically import these to avoid circular deps if possible, or just rely on API
                    const { getUserProfile, checkUserTenure } = await import("./api");
                    const userProfile = await getUserProfile(currentUser.uid);

                    if (userProfile) {
                        // Check Public Tenure (3 Years)
                        const isExpired = await checkUserTenure(userProfile);
                        if (isExpired) {
                            await signOut();
                            setProfile(null);
                            setUser(null);
                            alert("Your account membership period (3 Years) has ended. Your data has been removed.");
                        } else {
                            // Helper to map UserProfile to AdminProfile structure for type safety, 
                            // though ideally we should split contexts. For now, we return null profile for public users 
                            // because this context is typed as AdminProfile.
                            // However, strictly speaking, useAuth is used by AdminGuard which expects AdminProfile.
                            // Public pages might assume user is defined but profile is null.
                            setProfile(null);
                        }
                    } else {
                        setProfile(null);
                    }
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, profile, loading };
}
