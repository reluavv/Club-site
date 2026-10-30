"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEvents } from "@/lib/api";
import { Event } from "@/types";

export default function Home() {
    const { user, loading } = useAuth();
    const [nextEvent, setNextEvent] = useState<Event | null>(null);
    const [eventsLoaded, setEventsLoaded] = useState(false);

    useEffect(() => {
        const time = (date: string) => Date.parse(date) || Infinity;
        getEvents().then(events => {
            const live = events.filter(e => e.status === "ongoing" || e.status === "upcoming");
            // An ongoing event wins; otherwise the soonest upcoming one.
            live.sort((a, b) => Number(b.status === "ongoing") - Number(a.status === "ongoing") || time(a.date) - time(b.date));
            setNextEvent(live[0] ?? null);
            setEventsLoaded(true);
        });
    }, []);

    return (
        <div className="flex flex-col items-center justify-start min-h-screen pt-32 md:pt-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-20">
            {/* The logo is the page heading */}
            <h1 className="relative w-full max-w-[320px] md:max-w-[700px] lg:max-w-[900px] aspect-[3/1] mb-6 md:mb-8 animate-[fadeIn_1s_ease-out]">
                <Image
                    src="/images/light_text_logo.png"
                    alt="ReLU"
                    fill
                    className="object-contain drop-shadow-[0_0_25px_rgba(108,92,231,0.5)]"
                    priority
                />
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl lg:text-3xl text-gray-300 font-light tracking-[0.2em] uppercase mb-6 md:mb-8 animate-[slideUp_1s_ease-out_0.3s_both] drop-shadow-lg">
                Refining Logic and Unleashing AI
            </p>
            <p className="max-w-2xl text-base md:text-lg text-gray-400 leading-relaxed -mt-2 md:-mt-4 mb-8 md:mb-10 animate-[slideUp_1s_ease-out_0.4s_both]">
                The AI/ML and DSA student club at Amrita Vishwa Vidyapeetham, Amaravathi.
                Workshops, hackathons and talks — run by students, for students.
            </p>

            {/* CTA Buttons — one visual system, primary action first */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 animate-[slideUp_1s_ease-out_0.6s_both]">
                <Link
                    href="/events"
                    className="btn btn-lg btn-primary"
                >
                    Explore Events
                    <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                    href="/about"
                    className="btn btn-lg btn-secondary"
                >
                    Meet the Team
                </Link>
                {!loading && !user && (
                    <Link
                        href="/auth/signup"
                        className="btn btn-lg text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 hover:text-cyan-200"
                    >
                        Join the Family
                    </Link>
                )}
            </div>

            {/* Next event
                - A composed card with a labeled eyebrow, live state and full metadata,
                  not a bare link box.
                - Skeleton keeps the hero height stable while events load. */}
            <div className="mt-14 md:mt-16 w-full max-w-xl animate-[slideUp_1s_ease-out_0.9s_both]" aria-live="polite">
                {nextEvent ? (
                    <Link
                        href={`/events/${nextEvent.id}`}
                        className="group block text-left p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <span className={`chip ${
                                nextEvent.status === "ongoing"
                                    ? "bg-red-500/15 text-red-300 border-red-500/40"
                                    : "bg-purple-500/15 text-purple-300 border-purple-500/40"
                            }`}>
                                <Sparkles size={12} aria-hidden="true" />
                                {nextEvent.status === "ongoing" ? "Happening now" : "Next event"}
                            </span>
                            <ArrowRight size={18} className="text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">{nextEvent.title}</h2>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                                <Calendar size={14} className="text-purple-400/80" aria-hidden="true" />
                                {nextEvent.date || "Date TBD"}
                            </span>
                            {nextEvent.venue && (
                                <span className="flex items-center gap-2">
                                    <MapPin size={14} className="text-purple-400/80" aria-hidden="true" />
                                    {nextEvent.venue}
                                </span>
                            )}
                        </div>
                    </Link>
                ) : eventsLoaded ? (
                    <p className="text-sm text-gray-500">No upcoming events right now — check back soon.</p>
                ) : (
                    /* Skeleton: matches the card silhouette so the reveal is a swap, not a jump. */
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left" aria-hidden="true">
                        <div className="h-5 w-28 rounded-full bg-white/10 animate-pulse mb-4" />
                        <div className="h-6 w-3/4 rounded bg-white/10 animate-pulse mb-3" />
                        <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
                    </div>
                )}
            </div>
        </div>
    );
}
