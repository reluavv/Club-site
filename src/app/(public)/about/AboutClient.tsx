"use client";

import { AdminProfile } from "@/types";
import TeamMember from "@/components/ui/TeamMember";
import Image from "next/image";
import { useMemo } from "react";
import { User } from "lucide-react";
import { ClubRole, DEFAULT_ROLE_ID, roleLabel, roleRank } from "@/lib/roles";

interface AboutClientProps {
    team: AdminProfile[];
    roles: ClubRole[];
}

export default function AboutClient({ team, roles }: AboutClientProps) {
    const { coreTeam, activators } = useMemo(() => {
        const sorted = [...team].sort((a, b) => {
            return roleRank(roles, a.role) - roleRank(roles, b.role);
        });

        const core = sorted.filter(u => u.role !== DEFAULT_ROLE_ID);
        const acts = sorted.filter(u => u.role === DEFAULT_ROLE_ID);

        return { coreTeam: core, activators: acts };
    }, [team, roles]);

    const mapToMember = (u: AdminProfile) => ({
        name: u.displayName || "Member",
        role: roleLabel(roles, u.role),
        image: u.photoURL || "", // Empty string triggers fallback in component
        links: {
            linkedin: u.socials?.linkedin,
            github: u.socials?.github,
            instagram: u.socials?.instagram,
            mail: u.email,
        }
    });

    return (
        <div className="about-section min-h-screen pt-32 md:pt-36 pb-20 relative z-[1]">

            {/* SR-only page heading for screen readers */}
            <h1 className="sr-only">About ReLU — Core Team &amp; Founders</h1>

            {/* CORE TEAM */}
            {coreTeam.length > 0 && (
                <>
                    <h2 className="section-title text-center text-4xl md:text-[3rem] mb-12 md:mb-[4rem] text-white uppercase tracking-[5px] md:tracking-[10px] font-bold animate-[aurora_8s_linear_infinite] relative break-words px-4">
                        Core Team
                    </h2>
                    <div className="max-w-7xl mx-auto px-4 mb-24">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
                            {coreTeam.map(u => (
                                <TeamMember key={u.uid} member={mapToMember(u)} />
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ACTIVATORS */}
            {activators.length > 0 && (
                <>
                    <h2 className="section-title text-3xl md:text-[2.5rem] mb-12 md:mb-[4rem] text-white uppercase tracking-[5px] md:tracking-[10px] font-bold animate-[aurora_8s_linear_infinite] relative break-words px-4">
                        Activators
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-[#0099ff1a] via-[#0044ff1a]                        to-[#00ccff1a] blur-[40px] rounded-full -z-10 animate-[titleGlow_4s_ease-in-out_infinite pointer-events-none]" />
                    </h2>
                    <div className="max-w-5xl mx-auto px-4 mb-24">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {activators.map(u => (
                                <div key={u.uid} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 group">
                                    <h3 className="font-bold text-gray-200 text-sm group-hover:text-blue-400 transition-colors">
                                        {u.displayName || "Activator"}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* FOUNDERS - Legacy Section */}
            <h2 className="section-title mt-24 text-3xl md:text-[2.5rem] mb-12 text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-[5px] md:tracking-[10px] font-bold relative px-4 text-center">
                The Founders
            </h2>
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                    {[
                        { name: "Janke Yashwanth Reddy", img: "janke-yashwanth-reddy.jpg" },
                        { name: "Jerripothula Rakesh Naidu", img: "jerripothula-rakesh-naidu.jpg" },
                        { name: "Sricharan Vangoori", img: "sricharan-vangoori.jpg" },
                        { name: "Talasu Sai Nithin", img: "talasu-sai-nithin.png" },
                        { name: "Vadde Venkatasai", img: "vadde-venkatasai.jpg" },
                        { name: "Vivek Vignesh Baggam", img: "vivek-vignesh-baggam.jpg" }
                    ].map((founder, i) => (
                        <div key={i} className="relative group w-full max-w-sm">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur-sm group-hover:blur-md" />
                            <div className="relative h-full bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full border-2 border-yellow-500/50 mb-4 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.3)] relative">
                                    <Image
                                        src={`/images/founders/${founder.img}`}
                                        alt={founder.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-yellow-500 mb-1">{founder.name}</h3>
                                <p className="text-xs text-yellow-200/60 uppercase tracking-widest font-mono">Founding Member</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
