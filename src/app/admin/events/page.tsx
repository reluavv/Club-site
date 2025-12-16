
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getEvents, Event, createEvent, deleteEvent, subscribeToEvents, logActivity } from "@/lib/api";
import { Plus, Edit2, Trash2, Copy, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function EventsAdmin() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { profile } = useAuth();

    useEffect(() => {
        const unsubscribe = subscribeToEvents((data) => {
            setEvents(data);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleDelete = async (event: Event) => {
        if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
            return;
        }
        await deleteEvent(event.id);
        const adminName = profile?.displayName || "Admin";
        await logActivity(profile?.uid!, adminName, `Deleted event: ${event.title}`);
    };

    const handleClone = async (event: Event) => {
        if (!confirm(`Clone "${event.title}"?`)) return;

        // Remove ID and append (Copy) to title
        const { id, ...rest } = event;
        const newEvent = {
            ...rest,
            title: `${event.title} (Copy)`,
            status: "upcoming" as const // Reset status for cloned event
        };

        await createEvent(newEvent);
        const adminName = profile?.displayName || "Admin";
        await logActivity(profile?.uid!, adminName, `Cloned event: ${event.title}`);

        alert("Event cloned successfully!");
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Events</h1>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full text-green-400 text-xs font-mono animate-pulse border border-green-500/20">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        LIVE
                    </div>
                    <Link
                        href="/admin/events/new"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        <span>Add Event</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading events...</p>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-sm">
                                <th className="p-4 font-medium">Title</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{event.title}</td>
                                    <td className="p-4 text-gray-300">{event.date}</td>
                                    <td className="p-4">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${event.status === 'upcoming' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2 flex justify-end">
                                        <button
                                            onClick={() => handleClone(event)}
                                            className="text-yellow-400 hover:text-yellow-300 p-2 rounded hover:bg-white/5"
                                            title="Clone Event"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        <Link href={`/admin/events/${event.id}`} className="text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-white/5" title="Edit">
                                            <Edit2 size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(event)}
                                            className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-white/5"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No events found. Click &quot;Add Event&quot; to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
