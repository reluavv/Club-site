"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent, Event } from "@/lib/api";
import ImageUpload from "@/components/ui/ImageUpload";
import { Sparkles, Save, X, Calendar } from "lucide-react";

interface EventFormProps {
    initialData?: Event;
    isEdit?: boolean;
}

export default function EventForm({ initialData, isEdit = false }: EventFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Omit<Event, "id"> | Event>(
        {
            title: initialData?.title || "",
            date: initialData?.date || "",
            time: initialData?.time || "",
            venue: initialData?.venue || "",
            description: initialData?.description || "",
            fullDescription: initialData?.fullDescription || "",
            details: initialData?.details || [],
            image: initialData?.image || "",
            status: initialData?.status || "upcoming",
            registrationStatus: initialData?.registrationStatus || "upcoming",
            isFeedbackOpen: initialData?.isFeedbackOpen || false,
            attendanceCode: initialData?.attendanceCode || "",
            avgRating: initialData?.avgRating || 0,
            feedbackCount: initialData?.feedbackCount || 0,
            minTeamSize: initialData?.minTeamSize || 1,
            maxTeamSize: initialData?.maxTeamSize || 1
        }
    );

    // Smart Status Automation logic
    const handleDateBlur = () => {
        // Try to parse the date and suggest status
        const eventDate = new Date(formData.date);
        if (!isNaN(eventDate.getTime())) {
            const now = new Date();
            if (eventDate < now && formData.status === "upcoming") {
                if (confirm("This date is in the past. Switch status to 'Past'?")) {
                    setFormData(prev => ({ ...prev, status: "past" }));
                }
            } else if (eventDate > now && formData.status === "past") {
                // Optional: Switch back to upcoming automagically
                setFormData(prev => ({ ...prev, status: "upcoming" }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit && initialData?.id) {
                await updateEvent(initialData.id, formData);
            } else {
                await createEvent(formData);
            }
            router.push("/admin/events");
            router.refresh();
        } catch (error) {
            console.error("Failed to save event", error);
            alert("Failed to save event. Check console.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-xl border border-white/10">

            {/* Smart Feature Banner */}
            {!isEdit && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-300">
                    <Sparkles size={16} />
                    <span>Pro Tip: Enter a past date, and I&apos;ll automatically verify the status for you!</span>
                </div>
            )}

            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <ImageUpload
                    path="event-images"
                    currentImage={formData.image}
                    onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Event Title</label>
                <input
                    type="text"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Date</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. March 5, 2025"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pl-10"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            onBlur={handleDateBlur}
                        />
                        <Calendar className="absolute left-3 top-3.5 text-gray-500" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Status</label>
                    <select
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as "upcoming" | "past" })}
                    >
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Time</label>
                    <input
                        type="text"
                        placeholder="e.g. 10:00 AM - 1:00 PM"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Venue</label>
                    <input
                        type="text"
                        placeholder="e.g. Auditorium, Block A"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.venue}
                        onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Min Team Size</label>
                    <input
                        type="number"
                        min={1}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.minTeamSize || 1}
                        onChange={e => setFormData({ ...formData, minTeamSize: parseInt(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Max Team Size</label>
                    <input
                        type="number"
                        min={1}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.maxTeamSize || 1}
                        onChange={e => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Set to 1 for individual events.</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Short Description</label>
                <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-400">Full Details</label>
                    <p className="text-gray-400 text-sm">Upload a cover image for the event. (Max 5MB)</p>
                </div>
                <textarea
                    rows={8}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                    value={formData.fullDescription}
                    onChange={e => setFormData({ ...formData, fullDescription: e.target.value })}
                    placeholder="# Event Agenda\n\n- Introduction\n- Keynote\n- Networking"
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-400">Key Points / Agenda (One per line)</label>
                </div>
                <textarea
                    rows={5}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                    value={formData.details ? formData.details.join('\n') : ''}
                    onChange={e => setFormData({ ...formData, details: e.target.value.split('\n') })}
                    placeholder="Time: 10:00 AM\nVenue: Auditorium\nSpeaker: Dr. Smith"
                />
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                <Link href="/admin/events" className="px-6 py-3 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <X size={18} /> Cancel
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
                </button>
            </div>
        </form>
    );
}
