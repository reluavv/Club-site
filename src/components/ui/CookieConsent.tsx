"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { enableAnalytics } from "@/lib/firebase";

const CONSENT_KEY = "relu_cookie_consent";

function readConsent() {
    try {
        return localStorage.getItem(CONSENT_KEY);
    } catch {
        return null;
    }
}

function saveConsent(value: "accepted" | "declined") {
    try {
        localStorage.setItem(CONSENT_KEY, value);
    } catch { }
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = readConsent();
        if (consent === "accepted") {
            enableAnalytics();
            return;
        }
        if (consent === "declined") return;

        // Short delay so the banner doesn't flash in during page load
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleAccept = () => {
        saveConsent("accepted");
        enableAnalytics();
        setVisible(false);
    };

    const handleDecline = () => {
        saveConsent("declined");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div role="dialog" aria-label="Cookie preferences" className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-500">
            <div className="max-w-4xl mx-auto bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon + Text */}
                    <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                            <Cookie className="text-purple-400" size={20} />
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Signing in needs cookies. With your permission we also use Firebase Analytics to see how the site is used.{" "}
                            <Link
                                href="/privacy"
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium transition-colors"
                            >
                                Privacy Policy
                            </Link>
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                            onClick={handleDecline}
                            className="flex-1 sm:flex-none px-5 py-2 border border-white/15 text-gray-300 hover:text-white hover:bg-white/5 text-sm font-bold rounded-lg transition-colors"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20"
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
