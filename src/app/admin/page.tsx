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
                <StatLink
                    href="/admin/students"
                    title="Registered Students"
                    value={userCount}
                    icon={<Globe size={18} />}
                    color="yellow"
                    bottomNote="site accounts · open the student list"
                />
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
            <section aria-labelledby="recent-activity" className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
                <h2 id="recent-activity" className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-blue-400" /> Recent Activity
                </h2>

                {logs.length > 0 ? (
                    <ul className="divide-y divide-white/5">
                        {logs.slice(0, 12).map((log) => (
                            <AuditLogItem key={log.id} log={log} />
                        ))}
                        {logs.length > 12 && (
                            <li className="pt-3 text-xs text-gray-500">Showing the 12 most recent of {logs.length} records kept by audit retention.</li>
                        )}
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

/**
 * One expandable audit-log row. The only secret-free facts (actor name + action
 * string + timestamp stored by the app itself) are shown inline; the optional
 * structured `details` payload is only readable after expanding. Details come
 * from the same subscription the code already fetched — never extra queries.
 */
function AuditLogItem({ log }: { log: AuditLog }) {
    const [open, setOpen] = useState(false);
    const when = log.timestamp?.toDate ? log.timestamp.toDate() : null;
    const detailEntries = open && log.details && typeof log.details === "object"
        ? Object.entries(log.details as Record<string, unknown>).filter(([k, v]) => {
            // Never render sensitive material even if it ever landed in metadata.
            if (!k) return false;
            if (/token|password|secret|key/i.test(k)) return false;
            const s = typeof v === "string" ? v : JSON.stringify(v) ?? "";
            return s !== "{}" && s !== "[]" && s.length > 0;
        })
        : null;

    return (
        <li className="py-3 first:pt-1 last:pb-1">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <span className="mt-[7px] w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 break-words">
                        <span className="font-semibold text-blue-300">{log.actorName || "An admin"}</span>{" "}
                        <span className="text-gray-300">{log.action}</span>
                    </p>
                    <div className="mt-1 sm:hidden">
                        {when && <time className="text-xs text-gray-500 font-mono block">{when.toLocaleString("en-GB")}</time>}
                    </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                    <time className="hidden sm:block text-xs text-gray-500 font-mono whitespace-nowrap shrink-0">
                        {when ? when.toLocaleString("en-GB") : ""}
                    </time>
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        aria-expanded={open}
                        aria-controls={`log-detail-${log.id}`}
                        className="text-xs font-semibold text-gray-500 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-blue-400 shrink-0"
                    >
                        {open ? "Hide" : "Details"} {open ? "\u25b2" : "\u25bc"}
                    </button>
                </div>
            </div>
            <div
                id={`log-detail-${log.id}`}
                hidden={!open}
                className="mt-2 ml-[5px] pl-5 border-l border-white/10 text-sm"
            >
                {!detailEntries || detailEntries.length === 0 ? (
                    <p className="text-gray-500 italic">No additional details were recorded for this action.</p>
                ) : (
                    <dl className="space-y-1.5 text-xs text-gray-300 max-w-full">
                        {detailEntries.map(([k, v]) => (
                            <div key={k} className="grid grid-cols-[auto_1fr] gap-2 max-sm:block">
                                <dt className="text-gray-500 font-semibold break-words">{k}:</dt>
                                <dd className="break-words whitespace-pre-wrap font-mono overflow-hidden">{typeof v === "string" ? v : JSON.stringify(v, null, 2)}</dd>
                            </div>
                        ))
                        }
                    </dl>
                )}
                <p className="text-[11px] text-gray-600 mt-2 font-mono break-all">actor uid: {log.actorUid}</p>
            </div>
        </li>
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
