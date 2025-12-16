"use client";

import Link from "next/link";
import { ClipboardList, Users, MessageSquare, Play, StopCircle, CheckCircle, AlertCircle, Trash2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { getEvents, updateEvent, logActivity, purgeEventData, getEventRegistrations } from "@/lib/api";
import { convertToCSV } from "@/lib/csvUtils";

import { Event } from "@/types";
import { useAuth } from "@/lib/auth";

export default function FormsDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();

    const [stats, setStats] = useState({ totalAttendees: 0, avgRating: 0, feedbackCount: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getEvents();

        // Calculate Stats
        let totalRatingSum = 0;
        let totalFeedbackCount = 0;

        data.forEach(e => {
            if (e.avgRating && e.feedbackCount) {
                totalRatingSum += (e.avgRating * e.feedbackCount);
                totalFeedbackCount += e.feedbackCount;
            }
        });

        const calculatedAvg = totalFeedbackCount > 0 ? (totalRatingSum / totalFeedbackCount).toFixed(1) : "0.0";

        setStats({
            totalAttendees: 0,
            avgRating: parseFloat(calculatedAvg),
            feedbackCount: totalFeedbackCount
        });

        // Sort: Active/Open events first, then by date
        const sorted = data.sort((a, b) => {
            if (a.status === 'upcoming' && b.status === 'past') return -1;
            return b.date.localeCompare(a.date);
        });
        setEvents(sorted);
        setLoading(false);
    };

    // Helper: Check if event date is fully in the past (Yesterday or before)
    const isEventPast = (dateStr: string) => {
        const eventDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // If event is today, it's NOT past. Logic: Past means "Previous days".
        return eventDate < today;
    };

    const handleToggleRegistration = async (event: Event) => {
        // 1. Block if event is past (Yesterday or before)
        if (isEventPast(event.date)) {
            alert("Cannot modify registration for past events.");
            return;
        }

        // 2. Logic: Open/Close toggle
        if (!event.registrationStatus || event.registrationStatus === 'upcoming') {
            if (!confirm(`Open registrations for "${event.title}"?`)) return;
            await updateEvent(event.id, { registrationStatus: 'open' });
            await logActivity(profile?.uid!, profile?.displayName || "Admin", `Opened registrations for: ${event.title}`);
        } else if (event.registrationStatus === 'open') {
            // 3. Exception: Registration can be re-opened ONLY IF event is in future (or today).
            // Since we already blocked "past" events at start, we just confirm closure here.
            if (!confirm(`Close registrations for "${event.title}"?`)) return;
            await updateEvent(event.id, { registrationStatus: 'closed' });
            await logActivity(profile?.uid!, profile?.displayName || "Admin", `Closed registrations for: ${event.title}`);
        } else if (event.registrationStatus === 'closed') {
            // Allow re-opening if not past (already checked above)
            if (!confirm(`Re-open registrations for "${event.title}"?`)) return;
            await updateEvent(event.id, { registrationStatus: 'open' });
            await logActivity(profile?.uid!, profile?.displayName || "Admin", `Re-opened registrations for: ${event.title}`);
        }
        loadData();
    };

    const handleToggleAttendance = async (event: Event) => {
        if (isEventPast(event.date)) {
            alert("Cannot manage attendance for past events.");
            return;
        }

        // ONE-WAY FLOW: upcoming -> active -> ended
        const currentStatus = event.attendanceStatus || 'upcoming';

        if (currentStatus === 'ended') {
            alert("Attendance has successfully ended. It cannot be restarted.");
            return;
        }

        if (currentStatus === 'upcoming') {
            // Start
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            if (!confirm(`Start attendance for "${event.title}"? Code: ${code}`)) return;
            await updateEvent(event.id, { attendanceCode: code, attendanceStatus: 'active' });
            await logActivity(profile?.uid!, profile?.displayName || "Admin", `Started attendance for: ${event.title}`);
        } else if (currentStatus === 'active') {
            // Stop (Final)
            if (!confirm(`STOP attendance for "${event.title}"?\n\nThis is IRREVERSIBLE. You cannot restart it.`)) return;
            await updateEvent(event.id, { attendanceCode: '', attendanceStatus: 'ended' });
            await logActivity(profile?.uid!, profile?.displayName || "Admin", `Ended attendance for: ${event.title}`);
        } else {
            // Fallback for transition from old system where status might be missing but code exists
            if (event.attendanceCode) {
                if (!confirm(`STOP attendance for "${event.title}"?\n\nThis is IRREVERSIBLE.`)) return;
                await updateEvent(event.id, { attendanceCode: '', attendanceStatus: 'ended' });
            } else {
                const code = Math.floor(1000 + Math.random() * 9000).toString();
                if (!confirm(`Start attendance for "${event.title}"? Code: ${code}`)) return;
                await updateEvent(event.id, { attendanceCode: code, attendanceStatus: 'active' });
            }
        }
        loadData();
    };

    const handleToggleFeedback = async (event: Event) => {
        if (isEventPast(event.date)) {
            alert("Cannot manage feedback for past events.");
            return;
        }

        const currentStatus = event.feedbackStatus || (event.isFeedbackOpen ? 'active' : 'upcoming');

        if (currentStatus === 'ended') {
            alert("Feedback has ended. It cannot be restarted.");
            return;
        }

        if (currentStatus === 'upcoming') {
            if (!confirm(`Open feedback for "${event.title}"?`)) return;
            await updateEvent(event.id, { isFeedbackOpen: true, feedbackStatus: 'active' });
            await logActivity(profile?.uid!, profile?.displayName || "Admin", `Opened feedback for: ${event.title}`);
        } else if (currentStatus === 'active') {
            if (!confirm(`CLOSE feedback for "${event.title}"?\n\nThis is IRREVERSIBLE.`)) return;
            await updateEvent(event.id, { isFeedbackOpen: false, feedbackStatus: 'ended' });
            await logActivity(profile?.uid!, profile?.displayName || "Admin", `Closed feedback for: ${event.title}`);
        }
        loadData();
    };

    const handleDownloadCSV = async (event: Event) => {
        const regs = await getEventRegistrations(event.id);
        if (regs.length === 0) {
            alert("No registrations found for this event.");
            return;
        }

        // Flatten data for CSV
        const csvData = regs.map(r => ({
            Name: r.userDetails.name,
            RollNo: r.userDetails.rollNo,
            Mobile: r.userDetails.mobile,
            Class: r.userDetails.class,
            Section: r.userDetails.section,
            Status: r.status,
            FeedbackGiven: r.feedbackSubmitted ? 'Yes' : 'No',
            RegisteredAt: r.registeredAt?.toDate().toLocaleString()
        }));

        convertToCSV(csvData, `${event.title}_registrations`);
    };

    return (
        <div className="max-w-6xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-8">Forms & Data</h1>

            {/* Quick Stats / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Link href="/admin/forms/registrations" className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                        <ClipboardList size={24} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Registrations</h2>
                    <p className="text-gray-400 text-sm">View full detailed logs.</p>
                </Link>
                {/* Stats placeholders */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                        <Users size={24} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Total Feedbacks</h2>
                    <p className="text-gray-400 text-sm">{stats.feedbackCount}</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 text-green-400">
                        <MessageSquare size={24} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Avg Rating</h2>
                    <p className="text-gray-400 text-sm">{stats.avgRating} / 5.0</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Event Lifecycle Manager</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4">Event</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Registration</th>
                            <th className="p-4">Attendance</th>
                            <th className="p-4">Feedback</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr> : events.map(event => (
                            <tr key={event.id} className="hover:bg-white/5">
                                <td className="p-4">
                                    <p className="font-bold">{event.title}</p>
                                    <p className="text-xs text-gray-400">{event.date}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {event.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggleRegistration(event)}
                                        className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${event.registrationStatus === 'open'
                                            ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                                            : (event.registrationStatus === 'closed' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-gray-500/20 text-gray-400 border-white/10 hover:border-white/30')
                                            }`}
                                    >
                                        {event.registrationStatus === 'open' ? 'OPEN' : (event.registrationStatus === 'closed' ? 'CLOSED' : 'NOT STARTED')}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggleAttendance(event)}
                                        disabled={!event.registrationStatus || event.registrationStatus === 'upcoming' || event.attendanceStatus === 'ended'}
                                        className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${event.attendanceStatus === 'active' || (event.attendanceCode && !event.attendanceStatus)
                                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                                            : (event.attendanceStatus === 'ended' ? 'bg-gray-500/10 text-gray-500 border-gray-600' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30')
                                            }`}
                                    >
                                        {event.attendanceStatus === 'ended' ? 'ENDED' : (
                                            event.attendanceStatus === 'active' || event.attendanceCode ? <><StopCircle size={14} /> STOP ({event.attendanceCode})</> : <><Play size={14} /> START</>
                                        )}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggleFeedback(event)}
                                        disabled={!event.registrationStatus || event.registrationStatus === 'upcoming' || event.feedbackStatus === 'ended'}
                                        className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${event.feedbackStatus === 'active' || (event.isFeedbackOpen && !event.feedbackStatus)
                                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30'
                                            : (event.feedbackStatus === 'ended' ? 'bg-gray-500/10 text-gray-500 border-gray-600' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30')
                                            }`}
                                    >
                                        {event.feedbackStatus === 'ended' ? 'ENDED' : (
                                            event.feedbackStatus === 'active' || event.isFeedbackOpen ? <><StopCircle size={14} /> STOP</> : <><Play size={14} /> START</>
                                        )}
                                    </button>
                                </td>

                                <td className="p-4 flex gap-2">
                                    <button
                                        onClick={() => handleDownloadCSV(event)}
                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Download All Registrations"
                                    >
                                        <Download size={16} />
                                    </button>



                                    {profile?.role === 'CTO' && (
                                        <button
                                            onClick={async () => {
                                                if (confirm(`⚠️ DANGER: PURGE DATA for "${event.title}"?\n\nThis will DELETE ALL registrations, attendance, and feedback.\nThe "Final Rating" will be SAVED and preserved.\n\nType "CONFIRM" to proceed.`)) {
                                                    await purgeEventData(event.id);
                                                    alert("Data purged. Final Rating preserved.");
                                                    loadData();
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Purge Data (Keep Rating)"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
