"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth"; // We might need to update auth.ts to support public signup without admin profile creation
import { createUserProfile } from "@/lib/api";
import Link from "next/link";
import { Mail, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { sendEmailVerification, User } from "firebase/auth";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!email.endsWith("@av.students.amrita.edu")) {
            setError("Only @av.students.amrita.edu emails are allowed.");
            setLoading(false);
            return;
        }

        try {
            // We use the existing signUp, but we need to handle the profile creation differently since it's a public user, not admin

            // Temporary: We'll use the auth directly here or refactor signUp later. 
            // For now, let's assume we import signUp from auth, but we need to prevent it from creating an AdminProfile.
            // Actually, the current signUp in auth.ts creates an AdminProfile. We should probably create a separate signUpForPublic function or handle it here.

            // NOTE: Since I cannot easily change auth.ts right this second without breaking admin flow, 
            // I will use direct firebase imports here for the public flow to ensure separation.

            const { createUserWithEmailAndPassword, getAuth } = await import("firebase/auth");
            const { auth } = await import("@/lib/firebase");

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send Verification Email
            await sendEmailVerification(user);

            // Create User Profile (Not Admin Profile)
            await createUserProfile(user.uid, email);

            router.push("/auth/verify-email");
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                setError("Email is already registered.");
            } else if (err.code === "auth/weak-password") {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
            <div className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Join the Family</h1>
                    <p className="text-gray-400 mt-2 text-sm">Create your account to access events</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">College Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-mono text-sm"
                                placeholder="u4...@av.students.amrita.edu"
                                required
                            />
                        </div>
                        <p className="text-[10px] text-gray-500">* Only @av.students.amrita.edu allowed</p>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-mono text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-mono text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0" size={18} />
                            <p className="text-red-400 text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating Account..." : <>Sign Up <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Already verified?{" "}
                        <Link href="/auth/login" className="text-red-400 hover:text-red-300 font-bold transition-colors">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
