"use client";

import { useState, useEffect } from "react";
import { AdminProfile, subscribeToAllAdmins } from "@/lib/api";
import { Shield, Briefcase, GraduationCap, Coins, Terminal, Zap, Crown, Linkedin, Github, Instagram, Mail } from "lucide-react";
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
                        <div key={member.uid} className="group h-80 perspective-1000">
                            <div className="relative w-full h-full duration-500 preserve-3d group-hover:rotate-y-180">

                                {/* FRONT */}
                                <div className="absolute w-full h-full backface-hidden bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg backdrop-blur-sm">
                                    <div className="absolute top-4 right-4 opacity-50">
                                        {getRoleIcon(member.role)}
                                    </div>

                                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-600 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
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
