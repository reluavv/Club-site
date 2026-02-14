"use client";

import { useState, useEffect } from "react";
import { X, Star, Calendar, User, Loader2 } from "lucide-react";
import { getEventFeedbacks } from "@/lib/api";
import { Feedback } from "@/types";

interface FeedbackListModalProps {
    eventId: string;
    eventTitle: string;
    onClose: () => void;
}

export default function FeedbackListModal({ eventId, eventTitle, onClose }: FeedbackListModalProps) {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await getEventFeedbacks(eventId);
            // Sort by newest first
            data.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
            setFeedbacks(data);
            setLoading(false);
        };
        load();
    }, [eventId]);

    // Calculate detailed stats
    const stats = feedbacks.length > 0 ? {
        avg: (feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length).toFixed(1),
        count: feedbacks.length,
        breakdown: [5, 4, 3, 2, 1].map(star => ({
            star,
            count: feedbacks.filter(f => f.overallRating === star).length,
            percent: (feedbacks.filter(f => f.overallRating === star).length / feedbacks.length) * 100
        }))
    } : null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0a0a0a] z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Feedback Report</h2>
                        <p className="text-gray-400 text-sm">{eventTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            No feedback received yet.
                        </div>
                    ) : (
                        <div>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-white/5 p-6 rounded-xl border border-white/10">
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-white mb-2">{stats?.avg}</div>
                                        <div className="flex gap-1 justify-center mb-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} size={16}
                                                    className={star <= Math.round(parseFloat(stats?.avg || "0")) ? "text-yellow-400" : "text-gray-600"}
                                                    fill={star <= Math.round(parseFloat(stats?.avg || "0")) ? "currentColor" : "none"}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-gray-500 text-sm">{stats?.count} Reviews</div>
                                    </div>
                                    <div className="h-24 w-px bg-white/10 mx-auto" />
                                    <div className="flex-grow space-y-1">
                                        {/* Histogram */}
                                        {stats?.breakdown.map((item) => (
                                            <div key={item.star} className="flex items-center gap-2 text-xs">
                                                <span className="w-3 text-gray-400">{item.star}</span>
                                                <Star size={10} className="text-gray-500" />
                                                <div className="flex-grow h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-500" style={{ width: `${item.percent}%` }} />
                                                </div>
                                                <span className="w-6 text-gray-500 text-right">{item.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-4">
                                {feedbacks.map((item) => (
                                    <div key={item.id} className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {item.userName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{item.userName}</div>
                                                    <div className="text-xs text-gray-500">{item.submittedAt?.toDate().toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} size={12}
                                                        className={star <= item.overallRating ? "text-yellow-400" : "text-gray-700"}
                                                        fill={star <= item.overallRating ? "currentColor" : "none"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                                            {item.opinion}
                                        </p>
                                        {/* Matrix Ratings Detail (Toggleable? Or just show summary) - Let's keep it simple for now */}
                                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-500">
                                            {Object.entries(item.matrixRatings).map(([key, val]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="capitalize">{key}:</span>
                                                    <span className="text-gray-300 font-bold">{val}/5</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
