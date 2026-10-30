"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToEvents, subscribeToAllAdmins, subscribeToActivity, subscribeToTotalUsers, AuditLog } from "@/lib/api";
import { LayoutDashboard, Activity, CalendarCheck, Users, Globe, Plus, PenSquare, BookOpen, Image as ImageIcon, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

// Every metric and action below reflects real data sources already wired in the app:
// subscribed Firestore counts for events / admins / users, and audit_logs for activity.
// No fabricated statistics, and no extra database work beyond the existing subscriptions.
export default function AdminDashboard() {
    const [events, setEvents] = useState<number | null>(null);
    const [adminCount, setAdminCount] = useState<number | null>(null);
    const [userCount, setUserCount] = useState<number | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        const unsubEvents = subscribeToEvents((list) => setEvents(list.length));
        const unsubAdmins = subscribeToAllAdmins((admins) =>
            setAdminCount(admins.filter(u => u.status === "active" && u.role !== "pending").length));
        const unsubUsers = subscribeToTotalUsers((count) => setUserCount(count));
        const unsubLogs = subscribeToActivity((newLogs) => setLogs(newLogs));
        return () => { unsubEvents(); unsubAdmins(); unsubUsers(); unsubLogs(); };
    }, []);

    return (
        <div>
            <PageHeader
                title="Dashboard Overview"
                subtitle="Live snapshot of the club — everything below is real-time."
                icon={<LayoutDashboard size={26} />}
            />

            {/* Linked statistic cards: each opens its management surface */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <StatLink href="/admin/events" title="Total Events" value={events} icon={<CalendarCheck size={18} />} color="blue" />
                <StatLink href="/admin/team" title="Active Team" value={adminCount} icon={<Users size={18} />} color="purple" />
                <StatLink href="/admin/team" title="Registered Students" value={userCount} icon={<Globe size={18} />} color="yellow" bottomNote="site accounts" />
            </div>

            {/* Quick actions */}
            <h2 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <QuickAction href="/admin/events/new" icon={<Plus size={18} />} title="New Event" desc="Create and publish" />
                <QuickAction href="/admin/forms" icon={<PenSquare size={18} />} title="Forms" desc="Registrations & data" />
                <QuickAction href="/admin/resources" icon={<BookOpen size={18} />} title="Resources" desc="Add learning material" />
                <QuickAction href="/admin/gallery" icon={<ImageIcon size={18} />} title="Gallery" desc="Upload event photos" />
            </div>

            {/* Recent activity */}
            <section aria-labelledby="recent-activity" className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 id="recent-activity" className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-blue-400" /> Recent Activity
                </h2>

                {logs.length > 0 ? (
                    <ul className="space-y-3">
                        {logs.map((log) => (
                            <li key={log.id} className="flex items-start gap-4 py-2.5 border-b border-white/5 last:border-0">
                                <span
                                    className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"
                                    aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-200">
                                        <span className="font-semibold text-blue-300">{log.actorName || "An admin"}</span>{" "}
                                        <span className="text-gray-300">{log.action}</span>
                                    </p>
                                </div>
                                <time className="text-xs text-gray-500 font-mono whitespace-nowrap shrink-0">
                                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString("en-GB") : ""}
                                </time>
                            </li>
                        ))}
                    </ul>
                ) : logs === null ? (
                    <DashboardSkeleton rows={3} />
                ) : (
                    <p className="text-gray-500 text-sm py-6 text-center">No recent activity recorded yet. Actions taken across the dashboard will appear here.</p>
                )}
            </section>
        </div>
    );
}

function StatLink({
    href, title, value, icon, color, bottomNote,
}: {
    href: string;
    title: string;
    value: number | null;
    icon: React.ReactNode;
    color: "blue" | "purple" | "yellow";
    bottomNote?: string;
}) {
    const tone = {
        blue: "border-blue-500/25 bg-blue-500/10 text-blue-500",
        purple: "border-purple-500/25 bg-purple-500/10 text-purple-500",
        yellow: "border-yellow-500/25 bg-yellow-500/10 text-yellow-500",
    }[color];

    return (
        <Link
            href={href}
            className="group p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-4 focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={`${title}: ${value == null ? "loading" : value}. Open management page.`}
        >
            <span className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${tone}`} aria-hidden="true">{icon}</span>
            <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wider text-gray-400 font-semibold">{title}</span>
                {value == null ? (
                    <span className="block mt-1.5 h-7 w-16 bg-white/10 rounded animate-pulse" aria-hidden="true" />
                ) : (
                    <span className="block text-2xl font-bold mt-1 text-white">{value}</span>
                )}
                {bottomNote && <span className="block text-[11px] text-gray-500">{bottomNote}</span>}
            </span>
            <ChevronRight size={16} className="ml-auto text-gray-600 group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
        </Link>
    );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
    return (
        <Link
            href={href}
            className="group p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all focus-visible:ring-2 focus-visible:ring-blue-400"
        >
            <span className="text-blue-400 block mb-1.5" aria-hidden="true">{icon}</span>
            <span className="block font-semibold text-sm text-white">{title}</span>
            <span className="block text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">{desc}</span>
        </Link>
    );
}

function DashboardSkeleton({ rows }: { rows: number }) {
    return (
        <div aria-label="Loading recent activity" role="status" className="space-y-3 py-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" style={{ width: `${88 - i * 9}%` }} />
            ))}
        </div>
    );
}
