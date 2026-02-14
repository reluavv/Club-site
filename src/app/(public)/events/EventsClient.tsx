"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Calendar, Clock, MapPin, ExternalLink, X, Check, AlertCircle, Loader2, MessageSquare, CheckCircle, Star, Users } from "lucide-react";
import { Event } from "@/types";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { subscribeToEvents, registerForEvent, checkRegistrationStatus, getUserProfile } from "@/lib/api";
import { isRegistrationWindowOpen } from "@/lib/dateUtils";
import Link from "next/link";

export default function EventsClient({ events: initialEvents }: { events: Event[] }) {
    const { user } = useAuth();
    const router = useRouter();

    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

    // Real-time Subscription
    useEffect(() => {
        const unsubscribe = subscribeToEvents((updatedEvents) => {
            setEvents(updatedEvents);
        });
        return () => unsubscribe();
    }, []);

    // Registration State
    const [registering, setRegistering] = useState(false);
    const [registration, setRegistration] = useState<any | null>(null); // Stores full registration object
    const [registrationError, setRegistrationError] = useState("");
    const [checkingStatus, setCheckingStatus] = useState(false);

    const [showCheckIn, setShowCheckIn] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    // Filter logic
    const filteredEvents = events.filter((event) => {
        if (filter === "all") return true;
        return event.status === filter;
    });

    // Initial check when selecting an event


    const checkStatus = useCallback(async () => {
        if (!selectedEvent || !user) return;
        setCheckingStatus(true);
        try {
            const reg = await checkRegistrationStatus(selectedEvent.id, user.uid);
            setRegistration(reg);
        } catch (e) {
            console.error(e);
        } finally {
            setCheckingStatus(false);
        }
    }, [selectedEvent, user]);

    // Initial check when selecting an event
    useEffect(() => {
        if (selectedEvent && user && selectedEvent.status === "upcoming") {
            checkStatus();
        } else {
            setRegistration(null);
        }
    }, [selectedEvent, user, checkStatus]);

    const [showTeamModal, setShowTeamModal] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    const handleRegisterClick = async () => {
        if (!user) {
            router.push(`/auth/login?redirect=/events`);
            return;
        }

        if (!selectedEvent) return;

        setRegistering(true);
        // Fetch Profile First
        try {
            const userProfile = await getUserProfile(user.uid);
            if (!userProfile || !userProfile.rollNo || !userProfile.class) {
                setRegistrationError("Please complete your profile first.");
                setTimeout(() => router.push("/profile?onboarding=true"), 2000);
                setRegistering(false);
                return;
            }
            setCurrentUserProfile(userProfile);

            // Check if Team Event
            if ((selectedEvent.maxTeamSize || 1) > 1) {
                setShowTeamModal(true);
                setRegistering(false); // Stop "loading" spinning on button, modal handles its own loading
            } else {
                // Individual Registration
                await handleDirectRegistration(userProfile);
            }
        } catch (e: any) {
            console.error(e);
            setRegistrationError("Failed to fetch profile.");
            setRegistering(false);
        }
    };

    const handleDirectRegistration = async (userProfile: any) => {
        if (!selectedEvent || !user) return;
        try {
            await registerForEvent(selectedEvent.id, user.uid, userProfile);
            checkStatus();
        } catch (e: any) {
            setRegistrationError(e.message || "Failed to register.");
        } finally {
            setRegistering(false);
        }
    }

    const handleTeamRegistration = async (teamName: string, members: any[]) => {
        if (!selectedEvent || !user || !currentUserProfile) return;
        // Call API with team details
        await registerForEvent(selectedEvent.id, user.uid, currentUserProfile, { teamName, teamMembers: members });
        checkStatus();
        // Don't close modal here, let the user close it after inviting members
    };

    const handleViewTeam = async () => {
        if (!user) return;
        try {
            const userProfile = await getUserProfile(user.uid);
            if (userProfile) {
                setCurrentUserProfile(userProfile);
                setShowTeamModal(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Helper to render the correct action button
    const renderActionButton = () => {
        if (!selectedEvent) return null;
        if (checkingStatus) {
            return (
                <button disabled className="px-8 py-3 bg-white/5 rounded-xl text-white font-bold flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={20} /> Checking Status...
                </button>
            );
        }

        // Helper to determine if current user attended
        const isAttended = user && registration && (
            registration.status === 'attended' ||
            (registration.attendance && registration.attendance[user.uid])
        );

        // Check Feedback Submission status
        const isFeedbackSubmitted = registration && (
            registration.feedbackSubmitted ||
            (user && registration.feedbackMap && registration.feedbackMap[user.uid])
        );

        // 1. Check Feedback Phase (Prioritized if Active)
        if (selectedEvent.isFeedbackOpen) {
            if (isAttended && !isFeedbackSubmitted) {
                return (
                    <button
                        onClick={() => setShowFeedback(true)}
                        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <MessageSquare size={20} /> Give Feedback
                    </button>
                );
            } else if (isFeedbackSubmitted) {
                return (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="text-green-400 flex items-center gap-2 font-bold"><Check size={20} /> Feedback Submitted</div>
                        <Link
                            href={`/events/${selectedEvent.id}`}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            View Details
                        </Link>
                    </div>
                );
            }
            // If not attended, fall through...
        }

        // 2. Check Attendance Phase (Prioritized if Code is Active)
        // User update: "Start Event" != "Start Attendance".
        // So we only show Check In if attendanceCode exists (implied active) OR attendanceStatus is active.
        // Even if status is 'ongoing', we wait for the Admin to click "Start Attendance" (which generates the code).

        const isAttendanceActive = selectedEvent.attendanceStatus === 'active' || !!selectedEvent.attendanceCode;

        if (isAttendanceActive && registration) {
            if (isAttended) {
                return (
                    <button disabled className="px-8 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                        <Check size={20} /> Checked In
                    </button>
                );
            } else if (registration.status === 'registered' || registration.status === 'attended') {
                // Note: 'attended' status users might re-open modal to see code? No, usually disabled above.
                // But if local logic fails, this catches it.
                return (
                    <button
                        onClick={() => setShowCheckIn(true)}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 animate-pulse"
                    >
                        <CheckCircle size={20} /> Check In Now
                    </button>
                );
            }
        }

        // 3. Registration Phase (Already Registered)
        if (registration) {
            if (registration.status === 'forming') {
                return (
                    <div className="flex flex-col gap-2 items-center w-full sm:w-auto">
                        <button
                            onClick={handleRegisterClick} // Re-uses profile fetch logic to open modal
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Users size={20} /> Manage Team (Forming)
                        </button>
                        <span className="text-xs text-yellow-400 font-medium">
                            Waiting for members to accept invites
                        </span>
                    </div>
                );
            }

            // Check for Team Details (applies to 'registered' and 'attended')
            if (registration.teamName) {
                return (
                    <div className="flex flex-col gap-2 items-center w-full sm:w-auto">
                        <button
                            onClick={handleViewTeam}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Users size={20} /> View Team
                        </button>
                        <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                            <Check size={12} /> Registration Confirmed
                        </span>
                    </div>
                );
            }

            // Default fallback for Individual or Team-without-name (unlikely)
            return (
                <button disabled className="px-8 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                    <Check size={20} /> Registered
                </button>
            );
        }

        // 4. Not Registered - Check Open Status (Prioritized over Past Status)

        // Check if explicitly open (Admin override) OR window is valid
        const isWindowOpen = isRegistrationWindowOpen(selectedEvent.date);
        const isOpen = selectedEvent.registrationStatus === 'open';

        if (isOpen) {
            // Admin forced open -> Ignore date check
        }

        if (selectedEvent.registrationStatus === 'open') {
            return (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleRegisterClick}
                        disabled={registering}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {registering ? <Loader2 className="animate-spin" size={20} /> : "Register Now"}
                    </button>
                    {registrationError && (
                        <p className="text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {registrationError}
                        </p>
                    )}
                </div>
            );
        }

        // 5. Past Event (Only if NOT open)
        if (selectedEvent.status !== 'upcoming') {
            return (
                <Link
                    href={`/events/${selectedEvent?.id}`}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                    View Event Gallery & Report <ExternalLink size={18} />
                </Link>
            );
        }

        // 6. Closed / Upcoming
        if (selectedEvent.registrationStatus === 'closed') {
            return (
                <button disabled className="px-8 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <X size={20} /> Registrations Closed
                </button>
            );
        } else {
            // Upcoming / Coming Soon
            return (
                <button disabled className="px-8 py-3 bg-white/5 text-gray-400 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <Clock size={20} /> Coming Soon
                </button>
            );
        }
    };

    return (
        <div className="min-h-screen pt-32 md:pt-36 pb-12 px-4">
            {/* Header */}
            <div className="text-center mb-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4 relative z-10">
                    Events & Workshops
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg relative z-10">
                    Join us for hands-on sessions, tech talks, and hackathons.
                </p>
            </div>

            {/* Filters */}
            <div className="flex justify-center gap-4 mb-8">
                {(["all", "upcoming", "past"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`
                            px-6 py-2 rounded-full font-medium transition-all capitalize
                            ${filter === f
                                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }
                        `}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {filteredEvents.map((event) => (
                    <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)] cursor-pointer flex flex-col h-full"
                    >
                        {/* Image */}
                        <div className="relative h-48 w-full overflow-hidden">
                            <Image
                                src={event.image || "/images/event-placeholder.jpg"}
                                alt={event.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-300">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-blue-400" />
                                        {event.date}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${event.status === 'upcoming' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                        {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-grow">
                            <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-grow">
                                {event.description}
                            </p>
                            <span className="text-blue-400 text-sm font-medium flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                View Details <ExternalLink size={16} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredEvents.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    No events found for this category.
                </div>
            )}

            {/* Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Image */}
                        <div className="relative h-64 w-full">
                            <Image
                                src={selectedEvent.image || "/images/event-placeholder.jpg"}
                                alt={selectedEvent.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedEvent.title}</h2>
                                <div className="flex flex-wrap gap-4 text-gray-300">
                                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-md">
                                        <Calendar size={16} className="text-blue-400" />
                                        {selectedEvent.date || 'Date TBD'}
                                    </span>
                                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-md">
                                        <Clock size={16} className="text-purple-400" />
                                        {selectedEvent.time || 'Time TBD'}
                                    </span>
                                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-md">
                                        <MapPin size={16} className="text-red-400" />
                                        {selectedEvent.venue || 'Venue TBD'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8">
                            {/* Rating display for past events */}
                            {selectedEvent.status === 'past' && selectedEvent.avgRating != null && selectedEvent.avgRating > 0 && (
                                <div className="flex items-center gap-3 mb-6 bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 rounded-xl">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={18}
                                                className={star <= Math.round(selectedEvent.avgRating!) ? 'text-yellow-400' : 'text-gray-600'}
                                                fill={star <= Math.round(selectedEvent.avgRating!) ? 'currentColor' : 'none'}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-yellow-400 font-bold text-sm">{selectedEvent.avgRating.toFixed(1)}</span>
                                    <span className="text-gray-500 text-sm">({selectedEvent.feedbackCount || 0} {selectedEvent.feedbackCount === 1 ? 'review' : 'reviews'})</span>
                                </div>
                            )}

                            <div className="prose prose-invert max-w-none mb-8">
                                <h3 className="text-xl font-bold text-white mb-4">About the Event</h3>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedEvent.fullDescription || selectedEvent.description}
                                </p>

                                {selectedEvent.details && selectedEvent.details.length > 0 && (
                                    <>
                                        <h3 className="text-xl font-bold text-white mt-8 mb-4">What to Expect</h3>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {selectedEvent.details.map((detail, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-gray-300">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10">
                                {renderActionButton()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCheckIn && selectedEvent && user && (
                <CheckInModal
                    eventId={selectedEvent.id}
                    userId={user.uid}
                    onClose={() => setShowCheckIn(false)}
                    onSuccess={() => checkStatus()}
                />
            )}

            {showFeedback && selectedEvent && user && (
                <FeedbackModal
                    eventId={selectedEvent.id}
                    registrationId={registration?.id}
                    userId={user.uid}
                    userName={user.displayName || "User"}
                    onClose={() => setShowFeedback(false)}
                    onSuccess={() => checkStatus()}
                />
            )}
            {showTeamModal && selectedEvent && currentUserProfile && (
                <TeamRegistrationModal
                    event={selectedEvent}
                    userProfile={currentUserProfile}
                    existingRegistration={registration}
                    onClose={() => setShowTeamModal(false)}
                    onRegister={handleTeamRegistration}
                    onStatusChange={() => checkStatus()}
                />
            )}
        </div>
    );
}

import CheckInModal from "@/components/public/CheckInModal";
import FeedbackModal from "@/components/public/FeedbackModal";
import TeamRegistrationModal from "@/components/public/TeamRegistrationModal";
