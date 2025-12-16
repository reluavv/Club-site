"use client";

import { useState } from "react";
import { X, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Event, UserProfile } from "@/types";

interface TeamRegistrationModalProps {
    event: Event;
    userProfile: UserProfile;
    onClose: () => void;
    onRegister: (teamName: string, members: any[]) => Promise<void>;
}

export default function TeamRegistrationModal({ event, userProfile, onClose, onRegister }: TeamRegistrationModalProps) {
    const minSize = event.minTeamSize || 1;
    const maxSize = event.maxTeamSize || 1;

    const [teamName, setTeamName] = useState("");
    const [members, setMembers] = useState<any[]>([
        { name: userProfile.displayName, rollNo: userProfile.rollNo, mobile: userProfile.mobile, isLeader: true }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const addMember = () => {
        if (members.length < maxSize) {
            setMembers([...members, { name: "", rollNo: "", mobile: "" }]);
        }
    };

    const removeMember = (index: number) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const updateMember = (index: number, field: string, value: string) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!teamName.trim()) {
            setError("Team Name is required.");
            return;
        }

        if (members.length < minSize) {
            setError(`Minimum team size is ${minSize}. Please add more members.`);
            return;
        }

        // Validate all members
        for (const m of members) {
            if (!m.name || !m.rollNo) {
                setError("All member details (Name & Roll No) are required.");
                return;
            }
        }

        setLoading(true);
        try {
            await onRegister(teamName, members);
            onClose();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to register team.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Team Registration</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {event.title} • Size: {minSize} - {maxSize} Members
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Team Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Team Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. Code Ninjas"
                            autoFocus
                        />
                    </div>

                    {/* Members List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-gray-400">Team Members ({members.length}/{maxSize})</label>
                            {members.length < maxSize && (
                                <button
                                    type="button"
                                    onClick={addMember}
                                    className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={14} /> Add Member
                                </button>
                            )}
                        </div>

                        {members.map((member, index) => (
                            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 relative group">
                                {index === 0 ? (
                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded">Team Leader (You)</div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => removeMember(index)}
                                        className="absolute top-2 right-2 text-red-500/50 hover:text-red-500 transition-colors p-1"
                                        title="Remove Member"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Name</label>
                                        <input
                                            type="text"
                                            value={member.name}
                                            onChange={(e) => updateMember(index, "name", e.target.value)}
                                            readOnly={index === 0}
                                            className={`w-full bg-transparent border-b ${index === 0 ? 'border-transparent text-gray-400 cursor-not-allowed' : 'border-white/20 focus:border-blue-500 text-white'} py-1 focus:outline-none transition-colors`}
                                            placeholder="Member Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Roll No</label>
                                        <input
                                            type="text"
                                            value={member.rollNo}
                                            onChange={(e) => updateMember(index, "rollNo", e.target.value)}
                                            readOnly={index === 0}
                                            className={`w-full bg-transparent border-b ${index === 0 ? 'border-transparent text-gray-400 cursor-not-allowed' : 'border-white/20 focus:border-blue-500 text-white'} py-1 focus:outline-none transition-colors`}
                                            placeholder="CB.EN.U4..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : "Complete Registration"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
