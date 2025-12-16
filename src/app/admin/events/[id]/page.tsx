"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EventForm from "@/components/admin/EventForm";
import { ArrowLeft } from "lucide-react";
import { getEvent, Event } from "@/lib/api";

export default function EditEventPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvent() {
            if (params.id) {
                const data = await getEvent(params.id);
                setEvent(data);
            }
            setLoading(false);
        }
        fetchEvent();
    }, [params.id]);

    if (loading) {
        return <div className="text-center text-gray-500 mt-10">Loading event...</div>;
    }

    if (!event) {
        return <div className="text-center text-red-500 mt-10">Event not found</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/events" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-3xl font-bold">Edit Event</h1>
            </div>

            <EventForm initialData={event} isEdit={true} />
        </div>
    );
}
