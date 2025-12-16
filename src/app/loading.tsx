"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Loader2 size={48} className="animate-spin text-blue-500" />
                <p className="text-gray-400 font-mono text-sm animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
