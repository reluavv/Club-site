"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import Sidebar from "@/components/admin/Sidebar";
import MobileRestriction from "@/components/admin/MobileRestriction";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            {/* Mobile Blocker: Visible only on small/medium screens */}
            <MobileRestriction />

            {/* Main Desktop Dashboard: Hidden on small screens to prevent layout thrashing behind the blocker */}
            <div className="hidden lg:flex min-h-screen bg-[#0a0a0a] text-white">
                <Sidebar />
                <main className="flex-1 p-8 overflow-y-auto h-screen">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
