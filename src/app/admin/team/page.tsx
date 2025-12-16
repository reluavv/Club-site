
"use client";

import { useState, useEffect } from "react";
import { AdminProfile, getAllAdmins, subscribeToAllAdmins } from "@/lib/api";
import { User, Shield, Briefcase, GraduationCap, Coins, Terminal, Zap, Crown } from "lucide-react";
import Image from "next/image";

const ROLE_HIERARCHY: Record<string, number> = {
    "President": 1,
    "VP_AIML": 2,
    "VP_DSA": 2, // Same rank
    "Mentor": 3,
    "Faculty": 4,
    "AdminHead": 5,
    "PRHead": 5,
    "Treasurer": 6,
    "CTO": 6,
    "Activator": 7,
    "admin": 99,
    "pending": 999
};

const ROLE_LABELS: Record<string, string> = {
    "President": "President",
    "VP_AIML": "Vice President (AIML)",
    "VP_DSA": "Vice President (DSA)",
    "Mentor": "Mentor",
    "Faculty": "Faculty Coordinator",
    "AdminHead": "Administrative Head",
    "PRHead": "PR Head",
    "Treasurer": "Treasurer",
    "CTO": "Chief Technology Officer",
    "Activator": "Activator"
};

export default function TeamAdmin() {
    const [members, setMembers] = useState<AdminProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAllAdmins((admins) => {
            // Filter out system admins if they don't hold a team role, or keep them?
            // User request implies listing the team structure.
            // We filter for only valid team roles.
            const validRoles = Object.keys(ROLE_HIERARCHY);

            const teamMembers = admins.filter(u =>
                u.status === "active" &&
                u.role !== "admin" &&
                u.role !== "pending"
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
            case "President": return <Crown className="text-yellow-500" />;
            case "VP_AIML":
            case "VP_DSA": return <Shield className="text-blue-500" />;
            case "Mentor": return <GraduationCap className="text-purple-500" />;
            case "Treasurer": return <Coins className="text-green-500" />;
            case "CTO": return <Terminal className="text-red-500" />;
            case "Activator": return <Zap className="text-orange-500" />;
            default: return <Briefcase className="text-gray-400" />;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Team Roster</h1>
                    <p className="text-gray-400 text-sm mt-1">Live view of active profiles from user database.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map(member => (
                        <div key={member.uid} className="bg-white/5 border border-white/10 rounded-xl p-6 relative group overflow-hidden">
                            {/* Role Badge */}
                            <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                {getRoleIcon(member.role)}
                            </div>

                            <div className="flex items-center gap-4 mb-4">


                                <div className="relative w-16 h-16 rounded-full bg-gray-800 border-2 border-white/10 overflow-hidden flex-shrink-0">
                                    {member.photoURL ? (
                                        <Image src={member.photoURL} alt={member.email} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xl">
                                            {member.email[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-lg font-bold text-white truncate">{member.displayName || "Unknown Member"}</h3>
                                    <p className="text-blue-400 text-sm truncate uppercase tracking-widest font-mono text-[10px]">
                                        {ROLE_LABELS[member.role] || member.role}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-envelope w-4"></i>
                                    <span className="truncate">{member.email}</span>
                                </div>
                                {member.socials?.linkedin && (
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <i className="fab fa-linkedin w-4"></i>
                                        <a href={member.socials.linkedin} target="_blank" rel="noreferrer" className="hover:underline truncate">
                                            LinkedIn Profile
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Read-only indicator */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <User size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No active team members found in the hierarchy.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
