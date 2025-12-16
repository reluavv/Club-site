"use client";

import { ShieldAlert, Terminal } from "lucide-react";
import Link from "next/link";

export default function MobileRestriction() {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center lg:hidden">
            <div className="w-full max-w-md space-y-8 relative">

                {/* Visual Glitch Effect Container */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-red-500/20 blur-[40px] rounded-full animate-pulse" />
                    <ShieldAlert size={80} className="text-red-500 mx-auto relative z-10 animate-[bounce_3s_infinite]" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold font-mono text-white tracking-wider border-b border-red-500/30 pb-4">
                        ACCESS DENIED
                    </h1>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6 font-mono text-sm text-red-200 text-left space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500/50 animate-[shimmer_2s_linear_infinite]" />
                        <p className="flex gap-2">
                            <span className="text-red-500">{">"}</span>
                            <span>DETECTING_DEVICE_TYPE... [MOBILE]</span>
                        </p>
                        <p className="flex gap-2">
                            <span className="text-red-500">{">"}</span>
                            <span>CHECKING_RESOLUTION... [INSUFFICIENT]</span>
                        </p>
                        <p className="flex gap-2">
                            <span className="text-red-500">{">"}</span>
                            <span>ERROR: SCREEN_REAL_ESTATE_TOO_SMALL_TO_CONTAIN_THIS_MUCH_POWER</span>
                        </p>
                    </div>

                    <p className="text-gray-400 max-w-sm mx-auto">
                        The Admin Console requires a desktop environment to safely manage the singularity. Please return to a larger terminal or proceed to the public sector.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all border border-white/10 hover:border-white/30"
                >
                    <Terminal size={18} />
                    Return to Safety
                </Link>
            </div>
        </div>
    );
}
