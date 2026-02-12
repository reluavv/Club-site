"use client";

import { useState, useEffect, useCallback } from "react";
import {
    X, Plus, Search, Loader2, AlertCircle, Send, Check, Clock,
    UserPlus, Users
} from "lucide-react";
import { Event, UserProfile, TeamInvitation, EventRegistration } from "@/types";
import {
    searchStudents, sendInvitation, subscribeToTeamInvitations
} from "@/lib/api";

interface TeamRegistrationModalProps {
    event: Event;
    userProfile: UserProfile;
    existingRegistration?: EventRegistration | null;
    onClose: () => void;
    onRegister: (teamName: string, members: any[]) => Promise<void>;
}

export default function TeamRegistrationModal({ event, userProfile, existingRegistration, onClose, onRegister }: TeamRegistrationModalProps) {
    const minSize = event.minTeamSize || 1;
    const maxSize = event.maxTeamSize || 1;

    // Form state - Init from existing registration if available
    const [teamName, setTeamName] = useState(existingRegistration?.teamName || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Search state
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [searching, setSearching] = useState(false);

    // Invitation state - Init based on whether registration exists
    const [teamCreated, setTeamCreated] = useState(!!existingRegistration);
    const [sentInvitations, setSentInvitations] = useState<TeamInvitation[]>([]);
    const [sendingTo, setSendingTo] = useState<string | null>(null);

    // Debounced search
    useEffect(() => {
        if (!teamCreated || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchStudents(searchTerm);
                // Filter out: self, already-invited students
                const invitedUserIds = new Set(sentInvitations.map(i => i.targetUserId));
                const filtered = results.filter(u =>
                    u.uid !== userProfile.uid && !invitedUserIds.has(u.uid)
                );
                setSearchResults(filtered);
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm, teamCreated, userProfile.uid, sentInvitations]);

    // Subscribe to invitation statuses once team is created
    useEffect(() => {
        if (!teamCreated) return;

        const unsub = subscribeToTeamInvitations(event.id, userProfile.uid, (invs) => {
            setSentInvitations(invs);
        });

        return () => unsub();
    }, [teamCreated, event.id, userProfile.uid]);

    // Step 1: Create team (registration with 'forming' status)
    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!teamName.trim()) {
            setError("Team name is required.");
            return;
        }

        setLoading(true);
        try {
            // Create registration with 'forming' status and no members yet
            // The onRegister callback will handle this
            await onRegister(teamName, []);
            setTeamCreated(true);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to create team.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Send invitation to a student
    const handleInvite = async (student: UserProfile) => {
        setSendingTo(student.uid);
        setError("");

        try {
            await sendInvitation({
                eventId: event.id,
                eventTitle: event.title,
                teamName,
                senderId: userProfile.uid,
                senderName: userProfile.displayName || "Unknown",
                targetUserId: student.uid,
                targetName: student.displayName || "Unknown",
                targetRollNo: student.rollNo || "",
            });

            // Clear search after invite
            setSearchTerm("");
            setSearchResults([]);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to send invitation.");
        } finally {
            setSendingTo(null);
        }
    };

    const acceptedCount = sentInvitations.filter(i => i.status === 'accepted').length;
    const pendingCount = sentInvitations.filter(i => i.status === 'pending').length;
    const totalTeamSize = 1 + acceptedCount; // leader + accepted members
    const canInviteMore = sentInvitations.length + 1 < maxSize; // +1 for leader

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111] z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {teamCreated ? "Manage Team" : "Create Team"}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {event.title} • Size: {minSize} - {maxSize} Members
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* STEP 1: Create Team */}
                {!teamCreated ? (
                    <form onSubmit={handleCreateTeam} className="p-6 space-y-6">
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

                        {/* Leader Info */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                    {userProfile.displayName?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{userProfile.displayName}</p>
                                    <p className="text-xs text-gray-500">{userProfile.rollNo} • Team Leader</p>
                                </div>
                                <span className="ml-auto px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded">Leader</span>
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm flex items-center gap-2">
                            <Users size={14} />
                            After creating, you can search and invite other students to join.
                        </p>

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
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Team & Invite Members"}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* STEP 2: Invite Members */
                    <div className="p-6 space-y-6">
                        {/* Team Status */}
                        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-white font-bold text-lg">{teamName}</p>
                                    <p className="text-gray-400 text-xs mt-0.5">
                                        {totalTeamSize >= minSize
                                            ? "✅ Team meets minimum size requirement"
                                            : `⏳ Need ${minSize - totalTeamSize} more member${minSize - totalTeamSize > 1 ? 's' : ''} to complete`
                                        }
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">{totalTeamSize}<span className="text-gray-500 text-sm">/{maxSize}</span></p>
                                    <p className="text-xs text-gray-500">members</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(totalTeamSize / maxSize) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Current Team Members */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 mb-3">Team Members</h3>
                            <div className="space-y-2">
                                {/* Leader */}
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                                        {userProfile.displayName?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">{userProfile.displayName}</p>
                                        <p className="text-gray-500 text-xs">{userProfile.rollNo}</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded">Leader</span>
                                </div>

                                {/* Invited Members */}
                                {sentInvitations.map((inv) => (
                                    <div key={inv.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${inv.status === 'accepted' ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                            : 'bg-white/10'
                                            }`}>
                                            {inv.targetName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium">{inv.targetName}</p>
                                            <p className="text-gray-500 text-xs">{inv.targetRollNo}</p>
                                        </div>
                                        {inv.status === 'pending' && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase rounded border border-yellow-500/20">
                                                <Clock size={10} /> Pending
                                            </span>
                                        )}
                                        {inv.status === 'accepted' && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase rounded border border-green-500/20">
                                                <Check size={10} /> Accepted
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Search & Invite Section */}
                        {canInviteMore && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                    <UserPlus size={14} /> Invite Members
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name or roll number..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                    />
                                    {searching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                                    )}
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                        {searchResults.map((student) => (
                                            <div key={student.uid} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {student.displayName?.charAt(0) || "?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">{student.displayName || "Unknown"}</p>
                                                    <p className="text-gray-500 text-xs">{student.rollNo || "No roll number"}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleInvite(student)}
                                                    disabled={sendingTo === student.uid || !student.rollNo}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0"
                                                >
                                                    {sendingTo === student.uid ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Send size={12} />
                                                    )}
                                                    Invite
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {searchTerm.length >= 2 && !searching && searchResults.length === 0 && (
                                    <p className="mt-2 text-gray-500 text-sm text-center py-4">No students found matching "{searchTerm}"</p>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <p className="text-gray-500 text-xs">
                                {pendingCount > 0 && `${pendingCount} invitation${pendingCount > 1 ? 's' : ''} pending • `}
                                {totalTeamSize >= minSize
                                    ? "Your team is ready!"
                                    : `Waiting for ${minSize - totalTeamSize} more member${minSize - totalTeamSize > 1 ? 's' : ''}`
                                }
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
