"use client";

import { useState, useEffect } from "react";
import { getEvents, getEventRegistrations } from "@/lib/api";
import { Event, EventRegistration } from "@/types";
import { Calendar, Download, Search, User } from "lucide-react";
import JsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RegistrationsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingRegs, setFetchingRegs] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        const data = await getEvents();
        // Sort by upcoming first
        const sorted = data.sort((a, b) => b.date.localeCompare(a.date));
        setEvents(sorted);
        setLoading(false);
    };

    const handleSelectEvent = async (event: Event) => {
        setSelectedEvent(event);
        setFetchingRegs(true);
        try {
            const regs = await getEventRegistrations(event.id);
            setRegistrations(regs);
        } catch (error) {
            console.error(error);
        } finally {
            setFetchingRegs(false);
        }
    };

    const exportToPDF = () => {
        if (!selectedEvent) return;

        const doc = new JsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(selectedEvent.title, 14, 22);

        doc.setFontSize(11);
        doc.text(`Date: ${selectedEvent.date}`, 14, 30);
        doc.text(`Total Registrations: ${registrations.length}`, 14, 36);

        const tableColumn = ["Roll No", "Name", "Class", "Section", "Mobile"];
        const tableRows = registrations.map(reg => [
            reg.userDetails.rollNo,
            reg.userDetails.name,
            reg.userDetails.class,
            reg.userDetails.section,
            reg.userDetails.mobile
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 44,
        });

        doc.save(`${selectedEvent.title.replace(/\s+/g, '_')}_registrations.pdf`);
    };

    const filteredRegistrations = registrations.filter(reg =>
        reg.userDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.userDetails.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-white">Loading events...</div>;

    if (!selectedEvent) {
        return (
            <div className="max-w-6xl mx-auto text-white">
                <h1 className="text-3xl font-bold mb-8">Select an Event</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div
                            key={event.id}
                            onClick={() => handleSelectEvent(event)}
                            className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 cursor-pointer transition-all hover:scale-[1.02]"
                        >
                            <h2 className="text-xl font-bold mb-2 line-clamp-1">{event.title}</h2>
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                                <Calendar size={16} /> {event.date}
                            </div>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${event.status === 'upcoming' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto text-white h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
                <div>
                    <button
                        onClick={() => setSelectedEvent(null)}
                        className="text-gray-400 hover:text-white text-sm mb-2"
                    >
                        ← Back to Events
                    </button>
                    <h1 className="text-3xl font-bold">{selectedEvent.title}</h1>
                    <p className="text-blue-400 mt-1">{selectedEvent.date}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Total Registrations</p>
                    <p className="text-4xl font-bold">{registrations.length}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search student name or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
                <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
                >
                    <Download size={18} /> Export PDF
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {fetchingRegs ? (
                    <div className="h-full flex items-center justify-center text-gray-400">Loading registrations...</div>
                ) : filteredRegistrations.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">No registrations found.</div>
                ) : (
                    <div className="overflow-x-auto h-full">
                        <table className="w-full text-left">
                            <thead className="bg-black/20 text-gray-400 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Student Name</th>
                                    <th className="px-6 py-4 font-bold">Roll Number</th>
                                    <th className="px-6 py-4 font-bold">Class</th>
                                    <th className="px-6 py-4 font-bold">Section</th>
                                    <th className="px-6 py-4 font-bold">Mobile</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredRegistrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs">
                                                    {reg.userDetails.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div>{reg.userDetails.name}</div>
                                                    {reg.teamName && (
                                                        <div className="text-xs text-blue-400 font-bold mt-0.5">
                                                            Team: {reg.teamName} <span className="text-gray-500 font-normal">({reg.teamMembers?.length} members)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-300">{reg.userDetails.rollNo}</td>
                                        <td className="px-6 py-4 text-gray-300">{reg.userDetails.class}</td>
                                        <td className="px-6 py-4 text-gray-300">{reg.userDetails.section}</td>
                                        <td className="px-6 py-4 text-gray-300 font-mono text-sm">{reg.userDetails.mobile}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/20 rounded text-xs font-bold uppercase">
                                                Registered
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
