"use client";

import { AdminProfile, subscribeToAllAdmins } from "@/lib/api";
import TeamMember from "@/components/ui/TeamMember";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";

interface AboutClientProps {
    team: AdminProfile[];
}

export default function AboutClient({ team: initialTeam }: AboutClientProps) {
    const [team, setTeam] = useState<AdminProfile[]>(initialTeam);

    useEffect(() => {
        const unsubscribe = subscribeToAllAdmins((admins) => {
            // Filter only active members
            const activeUsers = admins.filter(u => u.status === "active" && u.role !== "pending");
            setTeam(activeUsers);
        });
        return () => unsubscribe();
    }, []);

    // Unified sorted team list
    const sortedTeam = useMemo(() => {
        const HIERARCHY: Record<string, number> = {
            "President": 1,
            "VP_AIML": 2,
            "VP_DSA": 2,
            "AdminHead": 3,
            "PRHead": 3,
            "CTO": 4,
            "Treasurer": 4,
            "Mentor": 5,
            "Faculty": 6,
            "Activator": 99
        };

        const hierarchyMembers = team.filter(u => HIERARCHY[u.role] !== undefined);

        return hierarchyMembers.sort((a, b) => {
            const rankA = HIERARCHY[a.role] || 99;
            const rankB = HIERARCHY[b.role] || 99;
            return rankA - rankB;
        });
    }, [team]);

    // Helper to map AdminProfile to TeamMember props
    const mapToMember = (u: AdminProfile) => ({
        name: u.displayName || "Member",
        role: u.role,
        image: u.photoURL || "/images/placeholder-user.jpg",
        links: {
            linkedin: u.socials?.linkedin,
            github: u.socials?.github,
            instagram: u.socials?.instagram,
            mail: u.email,
        }
    });

    return (
        <div className="about-section min-h-screen px-4 sm:px-6 lg:px-8 pt-32 md:pt-36 pb-20 relative z-[1]">

            {/* Current Crew Title */}
            <h1 className="section-title text-center text-4xl md:text-[3rem] mb-12 md:mb-[4rem] text-white uppercase tracking-[5px] md:tracking-[10px] font-bold animate-[aurora_8s_linear_infinite] relative break-words px-4">
                Core Team
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-[#ff00ff1a] via-[#00ffff1a] to-[#8000ff1a] blur-[40px] rounded-full -z-10 animate-[titleGlow_4s_ease-in-out_infinite pointer-events-none]" />
            </h1>

            <div className="team-container max-w-7xl mx-auto">
                <div className="team-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10 px-4">
                    {sortedTeam.map(u => (
                        <TeamMember key={u.uid} member={mapToMember(u)} />
                    ))}
                </div>
            </div>

            {/* Founders - Forever Legacy */}
            <h1 className="section-title mt-24 text-center text-4xl md:text-[3rem] mb-8 md:mb-[2rem] text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-[5px] md:tracking-[10px] font-bold animate-[aurora_8s_linear_infinite] relative break-words px-4">
                The Founders
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-[#ffbd001a] via-[#ff99001a] to-[#ffcc001a] blur-[40px] rounded-full -z-10 animate-[titleGlow_4s_ease-in-out_infinite pointer-events-none]" />
            </h1>
            <div className="team-container max-w-7xl mx-auto">
                <div className="team-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {[
                        { name: "Janke Yashwanth Reddy", img: "Janke Yashwanth Reddy.jpg" },
                        { name: "Jerripothula Rakesh Naidu", img: "Jerripothula Rakesh Naidu.jpg" },
                        { name: "Sricharan Vangoori", img: "Sricharan Vangoori.jpg" },
                        { name: "Talasu Sai Nithin", img: "Talasu Sai Nithin.png" },
                        { name: "Vadde Venkatasai", img: "Vadde Venkatasai.jpg" },
                        { name: "Vivek Vignesh Baggam", img: "Vivek Vignesh Baggam.jpg" }
                    ].map((founder, i) => (
                        <div key={i} className="relative group">
                            {/* Gold Border for Founders */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur-sm group-hover:blur-md" />
                            <div className="relative h-full bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 flex flex-col items-center text-center">
                                <div className="w-32 h-32 rounded-full border-2 border-yellow-500/50 mb-4 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                    {/* Using standard img for local assets to avoid Next.js Image config issues with spaces */}
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={`/images/founders/${encodeURIComponent(founder.img)}`}
                                            alt={founder.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-yellow-500 mb-1">{founder.name}</h3>
                                <p className="text-sm text-yellow-200/60 uppercase tracking-widest font-mono">Founding Member</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
