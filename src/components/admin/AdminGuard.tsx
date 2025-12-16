"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, signOut } from "@/lib/auth";
import { ShieldAlert, LogOut } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, profile, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user && pathname !== "/admin/login" && pathname !== "/admin/signup") {
            router.push("/admin/login");
        }

        // Auto-Migrate Legacy Super Admin to CTO
        if ((profile?.role as string) === "super_admin") {
            // We need to import updateAdminRole dynamically or just rely on API
            import("@/lib/api").then(api => {
                api.updateAdminRole(user!.uid, "CTO").then(() => {
                    window.location.reload();
                });
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loading, pathname, router]);

    // Public auth pages
    if (pathname === "/admin/login" || pathname === "/admin/signup") {
        if (user) {
            router.push("/admin");
            return null;
        }
        return <>{children}</>;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) return null;

    // Handle Missing Profile (Auto-Setup)
    if (!profile && !loading) {
        return <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <SetupAccount user={user} />
        </div>;
    }

    // Handle Onboarding
    if (profile?.status === "onboarding") {
        if (pathname !== "/admin/onboarding") {
            router.push("/admin/onboarding");
            return null;
        }
        return <>{children}</>;
    } else if (pathname === "/admin/onboarding") {
        // Active users shouldn't see onboarding again
        router.push("/admin");
        return null;
    }

    // Check Role
    if (profile?.role === "pending") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
                <div className="bg-white/5 border border-white/10 p-8 rounded-xl max-w-md text-center backdrop-blur-sm">
                    <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Access Pending</h1>
                    <p className="text-gray-400 mb-8">
                        Your account has been created but requires administrator approval.
                        Please contact the team to activate your access.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                        >
                            Check Status Again
                        </button>
                        <button
                            onClick={() => signOut().then(() => router.push("/admin/login"))}
                            className="w-full py-2 text-gray-400 hover:text-white flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Check Tenure (3 Years)
    // Exclude CTO from expiry
    if (profile?.role === "admin" && profile?.approvedAt) {
        const approvalDate = profile.approvedAt.toDate();
        const now = new Date();
        const threeYearsInMs = 3 * 365 * 24 * 60 * 60 * 1000;
        const timeDiff = now.getTime() - approvalDate.getTime();

        if (timeDiff > threeYearsInMs) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
                    <div className="bg-white/5 border border-red-500/30 p-8 rounded-xl max-w-md text-center backdrop-blur-sm">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert size={32} />
                        </div>
                        <h1 className="text-2xl font-bold mb-4 text-red-500">Access Expired</h1>
                        <p className="text-gray-400 mb-8">
                            Your 3-year tenure as a ReLU Administrator has ended.
                            Thank you for your contributions to the club!
                            Your access has been automatically revoked.
                        </p>
                        <button
                            onClick={() => signOut().then(() => router.push("/admin/login"))}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            );
        }
    }

    // Check Allowed Roles
    // We allow all specialized roles (President, CTO, etc.) as long as they are active.
    // The previous check only allowed 'admin' or 'CTO'.
    const allowedRoles = [
        "President", "VP_AIML", "VP_DSA", "CTO", "AdminHead",
        "PRHead", "Treasurer", "Mentor", "Faculty", "Activator",
        "admin"
    ];

    if (allowedRoles.includes(profile?.role || "")) {
        return <>{children}</>;
    }

    // Default: Access Denied (safe fallback)
    return null;
}

// Internal Component to handle First-Run / Missing Profile Logic
import { useState } from "react";
import { createAdminProfile, isSystemInitialized } from "@/lib/api";
import { User } from "firebase/auth";

function SetupAccount({ user }: { user: User }) {
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    const handleSetup = async () => {
        setStatus("loading");
        try {
            const initialized = await isSystemInitialized();
            const role = initialized ? "pending" : "CTO";

            await createAdminProfile(user.uid, user.email || "");

            // If we just made them CTO (First user), we need to update the role in DB
            if (!initialized) {
                const { updateAdminRole } = await import("@/lib/api");
                await updateAdminRole(user.uid, "CTO");
            }

            window.location.reload(); // Reload to fetch new profile and proceed
        } catch (err) {
            console.error(err);
            setError("Failed to setup account. Please try again.");
            setStatus("idle");
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-8 rounded-xl max-w-md text-center backdrop-blur-sm">
            <h1 className="text-2xl font-bold mb-4">Account Setup</h1>
            <p className="text-gray-400 mb-8">
                We need to initialize your admin profile in the database.
            </p>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <button
                onClick={handleSetup}
                disabled={status === "loading"}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors disabled:opacity-50"
            >
                {status === "loading" ? "Setting up..." : "Initialize Account"}
            </button>
        </div>
    );
}
