import { db } from "@/lib/firebase";
import { doc, writeBatch, Timestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const batch = writeBatch(db);
        const dummyUsers = [
            { uid: "user_01", displayName: "Rahul Sharma", email: "rahul@example.com", rollNo: "22AIE001" },
            { uid: "user_02", displayName: "Priya Patel", email: "priya@example.com", rollNo: "22AIE002" },
            { uid: "user_03", displayName: "Amit Kumar", email: "amit@example.com", rollNo: "22AIE003" },
            { uid: "user_04", displayName: "Sneha Gupta", email: "sneha@example.com", rollNo: "22AIE004" },
            { uid: "user_05", displayName: "Vikram Singh", email: "vikram@example.com", rollNo: "22AIE005" },
            { uid: "user_06", displayName: "Anjali Rao", email: "anjali@example.com", rollNo: "22AIE006" },
            { uid: "user_07", displayName: "Rohit Verma", email: "rohit@example.com", rollNo: "22AIE007" },
            { uid: "user_08", displayName: "Kavita Reddy", email: "kavita@example.com", rollNo: "22AIE008" },
            { uid: "user_09", displayName: "Arjun Nair", email: "arjun@example.com", rollNo: "22AIE009" },
            { uid: "user_10", displayName: "Meera Iyer", email: "meera@example.com", rollNo: "22AIE010" }
        ];

        dummyUsers.forEach(u => {
            const userRef = doc(db, "users", u.uid);
            batch.set(userRef, {
                uid: u.uid,
                displayName: u.displayName,
                email: u.email,
                rollNo: u.rollNo,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`,
                isVerified: true, // Crucial for search
                createdAt: Timestamp.now(),
                class: "CSE-A",
                section: "A",
                mobile: "9999999999"
            });
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: "Created 10 dummy users. You can now search for them in the Team Registration modal."
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
