"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useAuth } from "@/lib/auth";
import {
    LogOut, LayoutDashboard, Calendar, Users, ClipboardList,
    BookOpen, Image as ImageIcon, Shield, Home, Skull, Terminal, MessageSquare
} from "lucide-react";

export default function Sidebar() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.push("/admin/login");
    };

    return (
        <aside className="w-64 bg-black/50 border-r border-white/10 p-6 flex flex-col hidden md:flex h-full">
            <h2 className="text-2xl font-bold text-blue-500 mb-8">ReLU Admin</h2>

            <nav className="flex-1 space-y-2 overflow-y-auto">
                <NavLink href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                <NavLink href="/admin/events" icon={<Calendar size={20} />} label="Events" />
                <NavLink href="/admin/team" icon={<Users size={20} />} label="Team Members" />
                <NavLink href="/admin/forms" icon={<ClipboardList size={20} />} label="Forms" />
                <div className="h-px bg-white/10 my-2" />
                <NavLink href="/admin/resources" icon={<BookOpen size={20} />} label="Resources" />
                <NavLink href="/admin/gallery" icon={<ImageIcon size={20} />} label="Gallery" />
                <NavLink href="/admin/messages" icon={<MessageSquare size={20} />} label="Messages" />

                {/* Manage Admins - CTO Only */}
                {profile?.role === "CTO" && (
                    <>
                        <div className="h-px bg-white/10 my-2" />
                        <NavLink href="/admin/admins" icon={<Shield size={20} />} label="Manage Admins" />
                    </>
                )}

                {/* Doomsday Link - CTO Only */}
                {profile?.role === "CTO" && (
                    <>
                        <div className="h-px bg-red-500/30 my-2" />
                        <NavLink href="/admin/doomsday" icon={<Skull size={20} className="text-red-500" />} label="Doomsday" className="text-red-400 hover:bg-red-500/10 hover:text-red-500" />
                    </>
                )}


            </nav>

            <div className="pt-6 border-t border-white/10 space-y-4 mt-auto">
                {/* Profile Summary */}
                <Link href="/admin/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden shrink-0">
                        {profile?.photoURL ? (
                            <img src={profile.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold">{user?.email?.[0].toUpperCase()}</span>
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate text-white">{profile?.displayName || "Admin"}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                </Link>

                <div className="space-y-1">
                    <Link href="/" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full p-2 text-xs">
                        <Home size={16} />
                        <span>View Site</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors w-full p-2 text-left text-xs"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

function NavLink({ href, icon, label, className }: { href: string; icon: React.ReactNode; label: string; className?: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${className || (isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white")}`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}
