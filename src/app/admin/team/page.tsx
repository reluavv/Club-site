"use client";

import { useState, useEffect } from "react";
import { AdminProfile, subscribeToAllAdmins } from "@/lib/api";
import { Shield, Briefcase, GraduationCap, Coins, Terminal, Zap, Crown, Linkedin, Github, Instagram, Mail, X, Calendar, User } from "lucide-react";
import Image from "next/image";

const ROLE_HIERARCHY: Record<string, number> = {
    "President": 1,
    "VP_AIML": 2,
    "VP_DSA": 2,
    "AdminHead": 3,
    "PRHead": 3,
    "Treasurer": 4,
    "Mentor": 5,
    "Faculty": 6,
    "CTO": 7,
    "Activator": 99,
    "admin": 999,
    "pending": 9999
};

const ROLE_LABELS: Record<string, string> = {
    "President": "President",
    "VP_AIML": "Vice President (AIML)",
    "VP_DSA": "Vice President (DSA)",
    "AdminHead": "Administrative Head",
    "PRHead": "PR Head",
    "Treasurer": "Treasurer",
    "CTO": "Chief Technology Officer",
    "Activator": "Activator",
    "Faculty": "Faculty Coordinator",
    "Mentor": "Mentor",
};

export default function TeamPage() {
    const [members, setMembers] = useState<AdminProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<AdminProfile | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAllAdmins((admins) => {
            const teamMembers = admins.filter(u =>
                u.status === "active" &&
                u.role !== "pending" &&
                u.role !== "admin"
            );

            // Sort by hierarchy
            teamMembers.sort((a, b) => {
                const rankA = ROLE_HIERARCHY[a.role] || 999;
                const rankB = ROLE_HIERARCHY[b.role] || 999;
                return rankA - rankB;
            });

            setMembers(teamMembers);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "President": return <Crown className="text-yellow-500" size={18} />;
            case "VP_AIML":
            case "VP_DSA": return <Shield className="text-blue-500" size={18} />;
            case "Mentor": return <GraduationCap className="text-purple-500" size={18} />;
            case "Treasurer": return <Coins className="text-green-500" size={18} />;
            case "CTO": return <Terminal className="text-red-500" size={18} />;
            case "Activator": return <Zap className="text-orange-500" size={18} />;
            default: return <Briefcase className="text-gray-400" size={18} />;
        }
    };

    return (
        <div className="min-h-screen pb-12">
            <h1 className="text-3xl font-bold mb-8">Club Team</h1>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {members.map(member => (
                        <div key={member.uid} onClick={() => setSelectedMember(member)} className="group h-80 perspective-1000 cursor-pointer">
                            <div className="relative w-full h-full duration-500 preserve-3d group-hover:rotate-y-180">

                                {/* FRONT */}
                                <div className="absolute w-full h-full backface-hidden bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg backdrop-blur-sm">
                                    <div className="absolute top-4 right-4 opacity-50">
                                        {getRoleIcon(member.role)}
                                    </div>

                                    <div className="w-32 h-32 rounded-full p-1 bg-[#000080] mb-6 shadow-[0_0_20px_rgba(0,0,128,0.5)]">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 relative">
                                            {member.photoURL ? (
                                                <Image src={member.photoURL} alt={member.displayName || "User"} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-3xl">
                                                    {(member.displayName || member.email)[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white text-center truncate w-full mb-2">{member.displayName}</h3>
                                    <p className="text-blue-400 text-xs text-center uppercase tracking-widest font-mono">
                                        {ROLE_LABELS[member.role] || member.role}
                                    </p>
                                </div>

                                {/* BACK */}
                                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg backdrop-blur-md">
                                    <h3 className="text-lg font-bold text-white mb-6">Contact Info</h3>

                                    <div className="space-y-4 w-full text-center">
                                        <div className="bg-black/20 rounded-lg p-2 w-full truncate">
                                            <p className="text-xs text-gray-400">EMAIL</p>
                                            <p className="text-sm text-white truncate" title={member.email}>{member.email}</p>
                                        </div>

                                        {member.rollNo && (
                                            <div className="bg-black/20 rounded-lg p-2 w-full">
                                                <p className="text-xs text-gray-400">ID</p>
                                                <p className="text-sm text-white font-mono">{member.rollNo}</p>
                                            </div>
                                        )}

                                        <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-white/10">
                                            {member.socials?.linkedin && (
                                                <a href={member.socials.linkedin} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-[#0077b5] transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
                                                    <Linkedin size={18} />
                                                </a>
                                            )}
                                            {member.socials?.github && (
                                                <a href={member.socials.github} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
                                                    <Github size={18} />
                                                </a>
                                            )}
                                            {member.socials?.instagram && (
                                                <a href={member.socials.instagram} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-pink-500 transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
                                                    <Instagram size={18} />
                                                </a>
                                            )}
                                            {!member.socials?.linkedin && !member.socials?.github && !member.socials?.instagram && (
                                                <p className="text-gray-500 text-xs italic">No socials linked</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MEMBER DETAIL MODAL */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/50 p-2 rounded-full transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="grid md:grid-cols-[250px_1fr]">
                            {/* Sidebar / Photo */}
                            <div className="bg-gradient-to-b from-[#000080]/20 to-black p-8 flex flex-col items-center justify-center text-center border-r border-white/10">
                                <div className="w-40 h-40 rounded-full p-1 bg-[#000080] mb-6 shadow-[0_0_30px_rgba(0,0,128,0.4)] relative">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                        {selectedMember.photoURL ? (
                                            <Image src={selectedMember.photoURL} alt={selectedMember.displayName || "User"} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-4xl">
                                                {(selectedMember.displayName || selectedMember.email)[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-[#111] rounded-full p-2 border border-white/10 shadow-lg">
                                        {getRoleIcon(selectedMember.role)}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">{selectedMember.displayName}</h2>
                                <span className="text-blue-400 text-sm font-mono uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-full">
                                    {selectedMember.role}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-400 mb-3 flex items-center gap-2">
                                        <User size={18} /> About
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                            <span className="text-gray-500">Email:</span>
                                            <span className="text-white break-all">{selectedMember.email}</span>
                                        </div>
                                        {selectedMember.rollNo && (
                                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                                <span className="text-gray-500">Roll No:</span>
                                                <span className="text-white font-mono">{selectedMember.rollNo}</span>
                                            </div>
                                        )}
                                        {selectedMember.dob && (
                                            <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                                <span className="text-gray-500">Birthday:</span>
                                                <span className="text-white">{new Date(selectedMember.dob).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                            <span className="text-gray-500">Status:</span>
                                            <span className={`capitalize ${selectedMember.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {selectedMember.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                            <span className="text-gray-500">Joined:</span>
                                            <span className="text-gray-300">
                                                {selectedMember.createdAt?.toDate ? selectedMember.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Socials */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-400 mb-3 flex items-center gap-2">
                                        <Shield size={18} /> Socials // Reuse shield or new icon
                                    </h3>
                                    <div className="flex gap-4">
                                        {selectedMember.socials?.linkedin && (
                                            <a href={selectedMember.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#0077b5]/20 text-[#0077b5] rounded-lg hover:bg-[#0077b5]/30 transition-colors">
                                                <Linkedin size={18} /> LinkedIn
                                            </a>
                                        )}
                                        {selectedMember.socials?.github && (
                                            <a href={selectedMember.socials.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                                                <Github size={18} /> GitHub
                                            </a>
                                        )}
                                        {selectedMember.socials?.instagram && (
                                            <a href={selectedMember.socials.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-500 rounded-lg hover:bg-pink-500/30 transition-colors">
                                                <Instagram size={18} /> Instagram
                                            </a>
                                        )}
                                        {!selectedMember.socials?.linkedin && !selectedMember.socials?.github && !selectedMember.socials?.instagram && (
                                            <span className="text-gray-600 text-sm italic">No social profiles linked.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
                .group:hover .group-hover\\:rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
}
