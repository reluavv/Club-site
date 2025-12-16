"use client";

import Link from "next/link";
import EventForm from "@/components/admin/EventForm";
import { ArrowLeft } from "lucide-react";

export default function AddEventPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/events" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-3xl font-bold">Add New Event</h1>
            </div>

            <EventForm />
        </div>
    );
}
