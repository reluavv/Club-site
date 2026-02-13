import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
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

export async function archiveOldLogs(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const q = query(collection(db, "audit_logs"), where("timestamp", "<", cutoffTimestamp));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const chunks = [];
    for (let i = 0; i < snapshot.docs.length; i += 500) {
        chunks.push(snapshot.docs.slice(i, i + 500));
    }

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    return snapshot.size;
}
