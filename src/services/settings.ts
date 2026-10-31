import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface OnboardingConfig {
    classes: string[];
    sections: string[];
}

const SETTINGS_DOC_ID = "onboarding_config";

export async function getOnboardingConfig(): Promise<OnboardingConfig> {
    try {
        const docRef = doc(db, "settings", SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as OnboardingConfig;
        }
        // Default config if not found
        return {
            classes: ["AIE", "CSE", "CCE", "AIDS"],
            sections: ["A", "B", "C"]
        };
    } catch (error) {
        console.warn("Error fetching onboarding config:", error);
        return {
            classes: ["AIE", "CSE", "CCE", "AIDS"],
            sections: ["A", "B", "C"]
        };
    }
}

export async function updateOnboardingConfig(data: OnboardingConfig) {
    // Merge true allows us to update parts of it if needed, but here we likely replace arrays
    await setDoc(doc(db, "settings", SETTINGS_DOC_ID), data, { merge: true });
}
