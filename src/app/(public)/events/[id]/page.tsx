"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { subscribeToEvent, subscribeToEventGallery } from "@/lib/api";
import { Event, GalleryImage } from "@/types";
import { Calendar, Clock, MapPin, Play, Image as ImageIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Since we cannot use async params in client components easily in current nextjs app router w/o React.use or await params.
// We'll simplistic approach: Filter from all events or use a direct getEvent(id) in api if it existed.
// For now, we fetch all events and filter. Ideally we should add getEvent(id)

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    // State
    const [event, setEvent] = useState<Event | null>(null);
    const [gallery, setGallery] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        if (!eventId) return;

        // Subscribe to Event Details
        const unsubEvent = subscribeToEvent(eventId, (updatedEvent) => {
            setEvent(updatedEvent);
            // If event is null (deleted), handle 404 behavior if needed, or stick with null state
            if (!updatedEvent) setLoading(false);
        });

        // Subscribe to Gallery
        const unsubGallery = subscribeToEventGallery(eventId, (updatedGallery) => {
            setGallery(updatedGallery);
            setLoading(false);
        });

        return () => {
            unsubEvent();
            unsubGallery();
        };
    }, [eventId]);

    if (loading) return <div className="min-h-screen pt-32 text-center text-white">Loading Event...</div>;
    if (!event) return <div className="min-h-screen pt-32 text-center text-white">Event not found.</div>;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-black">
            <div className="max-w-6xl mx-auto">
                <Link href="/events" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={18} /> Back to Events
                </Link>

                {/* Hero Section */}
                <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-blue-900/20">
                    <Image
                        src={event.image || "/images/event-placeholder.jpg"}
                        alt={event.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">{event.title}</h1>

                        <div className="flex flex-wrap gap-4 md:gap-8">
                            <div className="flex items-center gap-2 text-gray-300 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                <Calendar size={20} className="text-blue-400" />
                                <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                <Clock size={20} className="text-purple-400" />
                                <span>Time TBD</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                <MapPin size={20} className="text-red-400" />
                                <span>Venue TBD</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                    <div className="lg:col-span-2 prose prose-invert max-w-none text-gray-300 leading-loose text-lg">
                        <h2 className="text-white font-bold text-2xl mb-4">About the Event</h2>
                        <p className="whitespace-pre-wrap">{event.fullDescription || event.description}</p>

                        {event.details && event.details.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-white font-bold text-xl mb-4">Highlights</h3>
                                <ul className="space-y-2">
                                    {event.details.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        )}
                    </div>

                    {/* Sidebar / Quick Actions (Optional) */}
                    <div className="space-y-6">
                        {/* Could put related events or tags here */}
                    </div>
                </div>

                {/* Gallery Section */}
                {gallery.length > 0 && (
                    <div className="border-t border-white/10 pt-16">
                        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                            <ImageIcon className="text-yellow-400" /> Event Gallery
                        </h2>

                        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                            {gallery.map((media) => (
                                <div key={media.id} className="relative group break-inside-avoid rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                    {/* Handle Video vs Image */}
                                    {media.type === 'video' ? (
                                        <div className="relative aspect-video">
                                            {/* Ideally real video player or thumbnail */}
                                            <video src={media.src} controls className="w-full h-full object-cover" />
                                            <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white flex items-center gap-1 pointer-events-none">
                                                <Play size={10} /> Video
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative w-full">
                                            <Image
                                                src={media.src}
                                                alt={media.alt || "Event Image"}
                                                width={0}
                                                height={0}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="w-full h-auto hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {gallery.length === 0 && (
                    <div className="border-t border-white/10 pt-16 text-center text-gray-500">
                        <p>No photos or videos uploaded for this event yet.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
