"use client";

import { useState } from "react";
import { useAuth, signOut } from "@/lib/auth";
import { transferCTORole } from "@/lib/api";
import { Skull, AlertTriangle, ArrowRight, Database, ShieldAlert, Folder, Users, Calendar, Image as ImageIcon, Briefcase, BookOpen, MessageSquare, Settings, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import CollectionManager from "@/components/admin/CollectionManager";

export default function DoomsdayPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    // UI State
    const [showProtocol, setShowProtocol] = useState(false);
    const [activeCollection, setActiveCollection] = useState<string | null>(null);

    // Safety Check Component
    if (profile?.role !== "CTO") {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center text-white">
                <h1 className="text-4xl font-bold mb-4 text-gray-700">403 Forbidden</h1>
                <p className="text-gray-500">You are not authorized to view this page.</p>
            </div>
        );
    }

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (confirmText !== "TRANSFER ROLE") {
            alert("Please type TRANSFER ROLE to confirm.");
            return;
        }

        if (!confirm("⚠️ FINAL WARNING: You are about to transfer your CTO role. You will immediately lose CTO privileges and become a Mentor. This action cannot be undone by you.")) {
            return;
        }

        setLoading(true);
        try {
            if (user?.uid) {
                await transferCTORole(user.uid, email);
                alert("Role transfer successful. It's been an honor, Chief. 🫡");
                // Force logout or reload to reflect changes
                await signOut();
                router.push("/admin/login");
            }
        } catch (error: any) {
            console.error(error);
            alert("Transfer failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const collectionGroups = [
        {
            title: "User Management",
            items: [
                { id: 'admins', name: 'Admins', icon: ShieldAlert, color: 'text-purple-400' },
                { id: 'users', name: 'Users', icon: Users, color: 'text-blue-400' },
                { id: 'pending_registrations', name: 'Pending Admins', icon: AlertTriangle, color: 'text-orange-500' },
            ]
        },
        {
            title: "Content",
            items: [
                { id: 'events', name: 'Events', icon: Calendar, color: 'text-green-400' },
                { id: 'gallery', name: 'Gallery', icon: ImageIcon, color: 'text-pink-400' },
                { id: 'resources', name: 'Resources', icon: BookOpen, color: 'text-teal-400' },
            ]
        },
        {
            title: "System Data",
            items: [
                { id: 'registrations', name: 'Registrations', icon: Folder, color: 'text-orange-400' },
                { id: 'feedbacks', name: 'Feedbacks', icon: MessageSquare, color: 'text-yellow-200' },
                { id: 'messages', name: 'Messages', icon: MessageSquare, color: 'text-indigo-400' },
                { id: 'audit_logs', name: 'Audit Logs', icon: Database, color: 'text-red-500' },
                { id: 'settings', name: 'Settings', icon: Settings, color: 'text-gray-400' },
            ]
        }
    ];

    return (
        <div className="max-w-7xl mx-auto text-white pb-20">
            {/* Header */}
            <div className="mb-12 border-b border-white/10 pb-6 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Database className="text-blue-500" /> System Console
                    </h1>
                    <p className="text-gray-400 font-mono text-sm">
                        Direct Database Access & Storage Management.
                    </p>
                </div>
                <div className="text-xs font-mono text-gray-500">
                    Logged in as: <span className="text-blue-400">{user?.email}</span>
                </div>
            </div>

            {/* Main Console Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
                {/* Sidebar / Grid of Collections */}
                <div className="lg:col-span-1 space-y-6">
                    {collectionGroups.map((group) => (
                        <div key={group.title}>
                            <h2 className="text-xs font-bold text-gray-500 uppercase mb-3 px-2 flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span> {group.title}
                            </h2>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                                {group.items.map(col => (
                                    <button
                                        key={col.id}
                                        onClick={() => setActiveCollection(col.id)}
                                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${activeCollection === col.id ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <col.icon size={18} className={activeCollection === col.id ? 'text-white' : col.color} />
                                        <span className="font-mono text-sm">{col.name}</span>
                                        {activeCollection === col.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Active View */}
                <div className="lg:col-span-3">
                    {activeCollection ? (
                        <CollectionManager
                            collectionName={activeCollection}
                            onClose={() => setActiveCollection(null)}
                        />
                    ) : (
                        <div className="h-[600px] border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-600 bg-white/[0.02]">
                            <Database size={64} className="mb-6 opacity-20" />
                            <h3 className="text-xl font-bold mb-2 text-gray-500">No Collection Selected</h3>
                            <p className="text-sm">Select a collection from the sidebar to view and manage data.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-20 pt-12 border-t border-red-900/30">
                {!showProtocol ? (
                    <div className="flex flex-col items-center justify-center text-center">
                        <Skull size={48} className="text-red-900 mb-4 opacity-50" />
                        <h2 className="text-2xl font-bold text-red-500 mb-2">Danger Zone</h2>
                        <p className="text-gray-500 mb-8 max-w-md">
                            Advanced administrative actions including Role Transfer (Protocol 418).
                            These actions are irreversible and strictly monitored.
                        </p>
                        <button
                            onClick={() => setShowProtocol(true)}
                            className="bg-red-900/20 border border-red-500/20 hover:bg-red-900/40 hover:border-red-500/50 text-red-500 px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all"
                        >
                            <AlertTriangle size={20} /> Initiate Protocol 418
                        </button>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                                <Skull size={24} /> Protocol 418 Active
                            </h2>
                            <button
                                onClick={() => setShowProtocol(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Skull size={200} />
                            </div>

                            <p className="text-gray-400 mb-8 font-mono border-l-2 border-red-500 pl-4">
                                <strong>System Notice:</strong> You are initializing the Transfer of Power protocol.
                                Upon successful execution, your administrative tokens will be immediately partially revoked.
                            </p>

                            <form onSubmit={handleTransfer} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Successor Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="successor@relu.club"
                                        className="w-full bg-black/60 border border-white/10 rounded-lg p-3 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Confirmation</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Type 'TRANSFER ROLE' to confirm"
                                        className="w-full bg-black/60 border border-white/10 rounded-lg p-3 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                                        value={confirmText}
                                        onChange={e => setConfirmText(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || confirmText !== "TRANSFER ROLE"}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        "Executing Protocol..."
                                    ) : (
                                        <>
                                            <Skull size={20} /> EXECUTE TRANSFER <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

