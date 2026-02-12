"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface CheckInModalProps {
    eventId: string;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CheckInModal({ eventId, userId, onClose, onSuccess }: CheckInModalProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, userId, code }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Check-in failed.");
                setLoading(false);
                return;
            }

            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>

                <h2 className="text-xl font-bold mb-4">Self Check-in</h2>
                <p className="text-gray-400 text-sm mb-6">Enter the 4-digit code displayed by the organizer.</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        maxLength={4}
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            setError("");
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-center text-3xl tracking-[0.5em] font-mono mb-2 focus:border-blue-500 outline-none uppercase text-white"
                        placeholder="0000"
                    />
                    {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || code.length !== 4}
                        className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Verify & Check In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
