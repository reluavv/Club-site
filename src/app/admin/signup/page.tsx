"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth";
import Link from "next/link";

export default function AdminSignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPass) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Create Auth User
            const user = await signUp(email, password);
            if (user) {
                // 2. Create Pending Record (The "Dummy Table")
                const { createPendingRegistration } = await import("@/lib/api");
                await createPendingRegistration(user.uid, email);

                // 3. Sign Out immediately (they are not approved yet)
                const { signOut } = await import("@/lib/auth");
                await signOut();

                // 4. Show Success Message
                alert("Request Submitted! You will be notified via email once the CTO approves your access.");
                router.push("/admin/login");
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                setError("Email is already in use.");
            } else {
                setError("Failed to create account. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="bg-white/5 border border-white/10 p-8 rounded-xl w-full max-w-md backdrop-blur-sm">
                <h1 className="text-3xl font-bold text-center text-white mb-2">Request Access</h1>
                <p className="text-gray-400 text-center mb-8 text-sm">Create an account to join the ReLU Admin Team.</p>

                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            autoFocus
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Request Access"
                        )}
                    </button>

                    <div className="text-center text-sm text-gray-400">
                        Already have an account? <Link href="/admin/login" className="text-blue-400 hover:underline">Log In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
