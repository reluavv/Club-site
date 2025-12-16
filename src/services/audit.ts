import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { AuditLog } from "@/types";
import { logAuditAction } from "./common";

// Re-export common audit functions
export { logAuditAction, getAuditLogs } from "./common";

// Alias for frontend usage
export const logActivity = logAuditAction;

export function subscribeToActivity(callback: (logs: AuditLog[]) => void) {
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AuditLog));
        callback(logs);
    });
}
