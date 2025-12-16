"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useAuth, signOut } from "@/lib/auth";
import { getUserProfile, updateUserProfile, getOnboardingConfig, OnboardingConfig } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { User, LogOut, Save, Edit2, AlertCircle, Briefcase, Hash, Layers, CheckCircle, Camera } from "lucide-react";
import { UserProfile } from "@/types";
import AvatarSelector from "@/components/ui/AvatarSelector";

function ProfileContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Determine if we are in "onboarding" mode via query param or empty profile
    const [isEditing, setIsEditing] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        displayName: "",
        rollNo: "",
        class: "",
        section: "",
        mobile: "",
        hosteller: false
    });

    const [config, setConfig] = useState<OnboardingConfig>({ classes: [], sections: [] });
    const [error, setError] = useState("");

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [userProfile, onboardingConfig] = await Promise.all([
                getUserProfile(user.uid),
                getOnboardingConfig()
            ]);

            setConfig(onboardingConfig);
            setProfile(userProfile);

            if (userProfile) {
                setFormData({
                    displayName: userProfile.displayName || "",
                    rollNo: userProfile.rollNo || "",
                    class: userProfile.class || "",
                    section: userProfile.section || "",
                    mobile: userProfile.mobile || "",
                    hosteller: userProfile.hosteller || false
                });

                // If critical fields are missing, force edit mode
                if (!userProfile.rollNo || !userProfile.class) {
                    setIsEditing(true);
                }
            } else {
                // No profile yet? Should have been created at signup, but just in case
                setIsEditing(true);
            }

            // Force edit if query param is present
            if (searchParams.get("onboarding") === "true") {
                setIsEditing(true);
            }

        } catch (e) {
            console.error("Failed to load profile", e);
        } finally {
            setLoading(false);
        }
    }, [user, searchParams]);

    // Initial Load
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/auth/login");
                return;
            }
            if (!user.emailVerified) {
                router.push("/auth/verify-email");
                return;
            }
            loadData();
        }
    }, [user, authLoading, router, loadData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Basic Validation
        if (!formData.displayName || !formData.rollNo || !formData.class || !formData.section || !formData.mobile) {
            setError("Please fill in all fields.");
            return;
        }

        setSaving(true);
        try {
            if (!user) return;

            const promises = [
                updateUserProfile(user.uid, {
                    ...formData,
                    isVerified: true // Assumption: Filling this form completes verification/onboarding phase
                })
            ];

            await Promise.all(promises);

            // Reload data to reflect changes
            await loadData();
            setIsEditing(false);

            // Remove query param if exists
            if (searchParams.get("onboarding")) {
                router.replace("/profile");
            }

        } catch (e) {
            console.error(e);
            setError("Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarSelect = async (url: string) => {
        // Optimistic update
        if (profile && user) {
            setProfile({ ...profile, photoURL: url });
            // Save immediately
            try {
                await updateUserProfile(user.uid, { photoURL: url });
            } catch (e) {
                console.error("Failed to update avatar", e);
            }
        }
    };

    if (loading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen pt-32 md:pt-36 pb-12 px-4 max-w-4xl mx-auto">

            {showAvatarSelector && (
                <AvatarSelector
                    currentAvatar={profile?.photoURL}
                    onSelect={handleAvatarSelect}
                    onClose={() => setShowAvatarSelector(false)}
                />
            )}

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Your Profile</h1>
                <button
                    onClick={() => signOut().then(() => router.push("/"))}
                    className="flex items-center gap-2 text-red-500 hover:text-red-400 font-bold transition-colors bg-white/5 px-4 py-2 rounded-lg"
                >
                    <LogOut size={18} /> Sign Out
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {isEditing ? (
                    /* EDIT FORM */
                    <form onSubmit={handleSave} className="space-y-6 relative z-10">
                        <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                            {profile?.rollNo ? <Edit2 size={20} className="text-blue-400" /> : <CheckCircle size={20} className="text-green-400" />}
                            {profile?.rollNo ? "Edit Details" : "Complete your Profile"}
                        </h2>

                        {/* Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 px-4 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Roll Number</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        value={formData.rollNo}
                                        onChange={e => setFormData({ ...formData, rollNo: e.target.value.toUpperCase() })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 px-4 text-white focus:border-blue-500 focus:outline-none uppercase"
                                        placeholder="U4AIE..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Class / Branch</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <select
                                        value={formData.class}
                                        onChange={e => setFormData({ ...formData, class: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 px-4 text-white focus:border-blue-500 focus:outline-none appearance-none"
                                    >
                                        <option value="">Select Branch</option>
                                        {config.classes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Section</label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <select
                                        value={formData.section}
                                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 px-4 text-white focus:border-blue-500 focus:outline-none appearance-none"
                                    >
                                        <option value="">Select Section</option>
                                        {config.sections.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mobile Number</label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="+91..."
                                />
                            </div>
                        </div>

                        {/* Residence */}
                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                            <label className="text-sm font-bold text-gray-300">Residence Type:</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="residence"
                                    checked={formData.hosteller}
                                    onChange={() => setFormData({ ...formData, hosteller: true })}
                                    className="accent-blue-500"
                                />
                                <span className="text-gray-400 text-sm">Hosteller</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="residence"
                                    checked={!formData.hosteller}
                                    onChange={() => setFormData({ ...formData, hosteller: false })}
                                    className="accent-blue-500"
                                />
                                <span className="text-gray-400 text-sm">Day Scholar</span>
                            </label>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                            {profile?.rollNo && ( // Only show cancel if they already had a profile
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all"
                            >
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                        </div>

                    </form>
                ) : (
                    /* VIEW MODE */
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar / Identity */}
                            <div className="flex-shrink-0 mx-auto md:mx-0 text-center md:text-left relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl mb-4 mx-auto md:mx-0 relative">
                                    {profile?.photoURL ? (
                                        <Image
                                            src={profile.photoURL || ""}
                                            alt={profile.displayName || "Profile Picture"}
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                            {profile?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Edit Overlay */}
                                    <button
                                        onClick={() => setShowAvatarSelector(true)}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <Camera className="text-white" size={32} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowAvatarSelector(true)}
                                    className="absolute bottom-16 right-0 md:-right-2 bg-blue-600 p-2 rounded-full border-2 border-[#111] text-white shadow-lg hover:bg-blue-500 transition-colors md:hidden"
                                >
                                    <Edit2 size={16} />
                                </button>

                                <h2 className="text-2xl font-bold text-white">{profile?.displayName}</h2>
                                <p className="text-blue-400 mb-2">{profile?.rollNo}</p>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 border border-white/10">
                                    {profile?.hosteller ? "Hosteller" : "Day Scholar"}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Email</label>
                                    <p className="text-gray-300 font-mono text-sm break-all">{user?.email}</p>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Class</label>
                                    <p className="text-white font-bold">{profile?.class} - {profile?.section}</p>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Mobile</label>
                                    <p className="text-gray-300">{profile?.mobile}</p>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status</label>
                                    <p className="text-green-400 font-bold flex items-center gap-2">
                                        <CheckCircle size={14} /> Active Member
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold"
                            >
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
