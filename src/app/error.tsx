"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-lg">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} className="text-red-500" />
                </div>

                <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>

                <p className="text-gray-400 mb-8">
                    We encountered an unexpected error. Our team has been notified.
                    Please try refreshing the page or return home.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-bold transition-colors"
                    >
                        Return Home
                    </Link>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-12 p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-left overflow-auto max-h-60">
                        <p className="font-mono text-red-300 text-xs">{error.message}</p>
                        <pre className="font-mono text-gray-500 text-[10px] mt-2">{error.stack}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
