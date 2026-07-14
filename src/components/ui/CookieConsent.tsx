"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Check if consent has already been given
        const consent = localStorage.getItem("relu_cookie_consent");
        if (!consent) {
            // Small delay for better UX — don't show immediately on page load
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("relu_cookie_consent", "accepted");
        setVisible(false);
    };

    const handleDismiss = () => {
        localStorage.setItem("relu_cookie_consent", "dismissed");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-500">
            <div className="max-w-4xl mx-auto bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon + Text */}
                    <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                            <Cookie className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                We use cookies and Firebase services to provide you with a seamless experience, including authentication and analytics.
                                By continuing to use this site, you agree to our{" "}
                                <Link
                                    href="/privacy"
                                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium transition-colors"
                                >
                                    Privacy Policy
                                </Link>.
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                            onClick={handleAccept}
                            className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20"
                        >
                            Accept
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                            aria-label="Dismiss cookie notice"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
