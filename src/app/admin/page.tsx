"use client";


import { useEffect, useState } from "react";
import { subscribeToEvents, subscribeToAllAdmins, subscribeToActivity, subscribeToTotalUsers, AuditLog } from "@/lib/api";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AdminDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        events: 0,
        team: 0,
        users: 0
    });
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to Events
        const unsubEvents = subscribeToEvents((events) => {
            setStats(prev => ({ ...prev, events: events.length }));
        });

        // Subscribe to Admins (for Team count)
        const unsubAdmins = subscribeToAllAdmins((admins) => {
            const activeTeam = admins.filter(u => u.status === "active" && u.role !== "pending").length;
            setStats(prev => ({ ...prev, team: activeTeam }));
        });

        // Subscribe to Public Users (Real-time Count)
        const unsubUsers = subscribeToTotalUsers((count) => {
            setStats(prev => ({ ...prev, users: count }));
        });

        // Subscribe to Activity Logs
        const unsubActivity = subscribeToActivity((newLogs) => {
            setLogs(newLogs);
        });

        setLoading(false);

        return () => {
            unsubEvents();
            unsubAdmins();
            unsubUsers();
        };
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                <StatCard
                    title="Total Events"
                    value={loading ? "-" : stats.events.toString()}
                    icon="calendar-check"
                    color="blue"
                />
                <StatCard
                    title="Team Members"
                    value={loading ? "-" : stats.team.toString()}
                    icon="users"
                    color="purple"
                />

                <StatCard
                    title="Registered Users"
                    value={loading ? "-" : stats.users.toString()}
                    icon="globe"
                    color="yellow"
                />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>

                {logs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Admin</th>
                                    <th className="px-4 py-3">Activity</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-blue-400">
                                            {log.actorName || "Unknown"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">
                                            {log.action}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500 text-sm font-mono">
                                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('en-GB') : "Just now"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-gray-400 text-center py-8">
                        {loading ? "Loading..." : "No recent activity recorded yet."}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, alert = false }: { title: string; value: string; icon: string; color: string, alert?: boolean }) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        green: "bg-green-500/10 text-green-500 border-green-500/20",
        yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse",
    }

    return (
        <div className={`p-6 rounded-xl border ${colors[color as keyof typeof colors]} backdrop-blur-sm`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold mt-1 text-white">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color as keyof typeof colors]} bg-opacity-20`}>
                    <i className={`fas fa-${icon} text-lg`}></i>
                </div>
            </div>
        </div>
    )
}
