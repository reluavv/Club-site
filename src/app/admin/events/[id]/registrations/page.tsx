"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getEvent, getEventRegistrations, Event, EventRegistration } from "@/lib/api";
import { ArrowLeft, Download, Users, User, Clock, CheckCircle, XCircle, Search } from "lucide-react";

export default function EventRegistrationsPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (params.id) {
                const [eventData, regsData] = await Promise.all([
                    getEvent(params.id),
                    getEventRegistrations(params.id)
                ]);
                setEvent(eventData);
                setRegistrations(regsData);
            }
            setLoading(false);
        }
        fetchData();
    }, [params.id]);

    const isTeamEvent = event?.minTeamSize && event.minTeamSize > 1;

    const filteredRegistrations = registrations.filter(reg => {
        const searchLower = searchTerm.toLowerCase();
        if (isTeamEvent) {
            return (
                reg.teamName?.toLowerCase().includes(searchLower) ||
                reg.userDetails.name.toLowerCase().includes(searchLower) ||
                reg.userDetails.rollNo.toLowerCase().includes(searchLower)
            );
        } else {
            return (
                reg.userDetails.name.toLowerCase().includes(searchLower) ||
                reg.userDetails.rollNo.toLowerCase().includes(searchLower)
            );
        }
    });

    const handleExportCSV = () => {
        if (!event || registrations.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";

        if (isTeamEvent) {
            csvContent += "Team Name,Leader Name,Leader Roll No,Leader Mobile,Members Count,Members,Status,Registered At\n";
            registrations.forEach(reg => {
                const membersStr = reg.teamMembers?.map(m => `${m.name} (${m.rollNo})`).join("; ") || "";
                const row = [
                    reg.teamName || "N/A",
                    reg.userDetails.name,
                    reg.userDetails.rollNo,
                    reg.userDetails.mobile,
                    (reg.teamMembers?.length || 0) + 1, // +1 for leader
                    membersStr,
                    reg.status,
                    new Date(reg.registeredAt.seconds * 1000).toLocaleString()
                ].map(field => `"${field}"`).join(",");
                csvContent += row + "\n";
            });
        } else {
            csvContent += "Name,Roll No,Class,Section,Mobile,Status,Registered At\n";
            registrations.forEach(reg => {
                const row = [
                    reg.userDetails.name,
                    reg.userDetails.rollNo,
                    reg.userDetails.class,
                    reg.userDetails.section,
                    reg.userDetails.mobile,
                    reg.status,
                    new Date(reg.registeredAt.seconds * 1000).toLocaleString()
                ].map(field => `"${field}"`).join(",");
                csvContent += row + "\n";
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${event.title}_registrations.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!event) {
        return <div className="text-center text-red-500 mt-10">Event not found</div>;
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/admin/events" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">{event.title}</h1>
                            <p className="text-gray-400 text-sm">
                                {new Date(event.date).toLocaleDateString()} • {registrations.length} Registrations
                                {isTeamEvent && <span className="ml-2 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">Team Event</span>}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder={isTeamEvent ? "Search by Team Name, Leader Name or Roll No..." : "Search by Name, Roll No..."}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                {isTeamEvent ? (
                                    <>
                                        <th className="p-4">Team Details</th>
                                        <th className="p-4">Leader</th>
                                        <th className="p-4">Members</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4 text-right">Registered</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="p-4">Participant</th>
                                        <th className="p-4">Roll No</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4 text-right">Registered</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-sm">
                            {filteredRegistrations.map((reg) => (
                                <tr key={reg.id} className="hover:bg-white/5 transition-colors group">
                                    {isTeamEvent ? (
                                        // Team Row
                                        <>
                                            <td className="p-4 align-top">
                                                <div className="font-bold text-white text-base mb-1 flex items-center gap-2">
                                                    <Users size={16} className="text-blue-400" />
                                                    {reg.teamName}
                                                </div>
                                                <div className="text-xs text-gray-400 bg-white/5 inline-block px-2 py-0.5 rounded">
                                                    {reg.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="text-white font-medium">{reg.userDetails.name}</div>
                                                <div className="text-gray-500 font-mono text-xs">{reg.userDetails.rollNo}</div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="space-y-1">
                                                    {reg.teamMembers && reg.teamMembers.length > 0 ? (
                                                        reg.teamMembers.map((m, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-gray-300 text-xs">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                                                <span>{m.name}</span>
                                                                <span className="text-gray-500 font-mono">({m.rollNo})</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-500 italic">No members yet</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-gray-300 font-mono">
                                                {reg.userDetails.mobile}
                                            </td>
                                        </>
                                    ) : (
                                        // Individual Row
                                        <>
                                            <td className="p-4">
                                                <div className="font-bold text-white">{reg.userDetails.name}</div>
                                                <div className="text-xs text-gray-500">{reg.userDetails.mobile || "N/A"}</div>
                                            </td>
                                            <td className="p-4 font-mono text-blue-300">
                                                {reg.userDetails.rollNo}
                                            </td>
                                            <td className="p-4 text-gray-400">
                                                {reg.userDetails.class} - {reg.userDetails.section}
                                            </td>
                                            <td className="p-4 font-mono text-gray-400">
                                                {reg.userDetails.mobile}
                                            </td>
                                        </>
                                    )}
                                    <td className="p-4 text-right text-gray-500 font-mono text-xs">
                                        {reg.registeredAt?.seconds ? new Date(reg.registeredAt.seconds * 1000).toLocaleString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}

                            {filteredRegistrations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No registrations found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
