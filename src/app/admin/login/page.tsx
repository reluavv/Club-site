"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signIn(email, password);
            router.push("/admin");
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
                setError("Invalid email or password.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many attempts. Try again later.");
            } else {
                setError("Failed to login. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="bg-white/5 border border-white/10 p-8 rounded-xl w-full max-w-md backdrop-blur-sm">
                <h1 className="text-3xl font-bold text-center text-white mb-8">Admin Login</h1>

                <form onSubmit={handleLogin} className="space-y-6">
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

                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Enter Dashboard"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    <p>New administrator? <a href="/admin/signup" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Request access here</a></p>
                </div>
            </div>
        </div>
    );
}
