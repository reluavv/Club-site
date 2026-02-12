"use client";

import { useEffect, useState } from "react";
import { getAllAdmins, deleteAdmin, AdminProfile, PendingRegistration, getPendingRegistrations, approveRegistration, rejectRegistration, subscribeToAllAdmins, subscribeToPendingRegistrations, logActivity, updateAdminRole, createAdminDirectly } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Check, X, Shield, Trash2, User } from "lucide-react";

export default function AdminUsersPage() {
    const { profile } = useAuth();
    const [admins, setAdmins] = useState<AdminProfile[]>([]);
    const [pendingRegs, setPendingRegs] = useState<PendingRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);

    // New State for Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ email: "", password: "", role: "Activator" });

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createAdminDirectly(createForm.email, createForm.password, createForm.role, profile?.uid, profile?.displayName);
            alert("Admin created successfully!");
            setShowCreateModal(false);
            setCreateForm({ email: "", password: "", role: "Activator" }); // Reset
        } catch (err: any) {
            console.error(err);
            alert("Failed to create admin: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const ROLES = ["President", "VP_AIML", "VP_DSA", "AdminHead", "PRHead", "Treasurer", "Mentor", "Faculty", "Activator"];

    useEffect(() => {
        setLoading(true);
        // Subscribe to Admins
        const unsubscribeAdmins = subscribeToAllAdmins((data) => {
            setAdmins(data);
            setLoading(false);
        });

        // Subscribe to Pending Registrations
        const unsubscribePending = subscribeToPendingRegistrations((data) => {
            setPendingRegs(data);
        });

        return () => {
            unsubscribeAdmins();
            unsubscribePending();
        };
    }, []);


    const handleApprove = async (reg: PendingRegistration) => {
        if (!confirm(`Approve ${reg.email}? This will open your email client to notify them.`)) return;
        setLoading(true);
        try {
            await approveRegistration(reg.id, profile?.uid, profile?.displayName || "Admin");
            // Send Email
            const subject = "ReLU Admin Access Approved";
            const body = `Congratulations! Your request to join the ReLU Admin Team has been approved.\n\nPlease log in at https://relu.club/admin/login to complete your onboarding.`;

            // Send Email via API
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: reg.email,
                        subject,
                        text: body,
                        html: body.replace(/\n/g, '<br>')
                    })
                });
            } catch (err) {
                console.error("Failed to send email", err);
                alert("User approved, but failed to send email.");
            }

            const adminName = profile?.displayName || "CTO";
            // logActivity handled inside approveRegistration now, but we kept it? 
            // Wait, approveRegistration has logAuditAction inside it. We should probably remove the manual logActivity here to avoid double logging or update it. 
            // The existing code has MANUAL logActivity after approveRegistration.
            // services/admin.ts ALREADY logs it.
            // I should REMOVE the manual log here to avoid duplicates.
            // await logActivity(profile?.uid!, adminName, `Approved admin registration for: ${reg.email}`);

            alert("User approved!");
        } catch (e) {
            console.error(e);
            alert("Error approving user");
        }
    };

    const handleReject = async (reg: PendingRegistration) => {
        if (!confirm(`Reject ${reg.email}? This will open your email client to notify them.`)) return;
        setLoading(true);
        try {
            await rejectRegistration(reg.id, profile?.uid, profile?.displayName || "Admin");
            // Send Email
            const subject = "ReLU Admin Access Update";
            const body = "Your request to join the ReLU Admin Team has been declined at this time.\n\nIf you believe this is an error, please contact the club president.";

            // Send Email via API
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: reg.email,
                        subject,
                        text: body,
                        html: body.replace(/\n/g, '<br>')
                    })
                });
            } catch (err) {
                console.error("Failed to send email", err);
            }

            // Manual log removed as service handles it
            // const adminName = profile?.displayName || "CTO";
            // await logActivity(adminName, `Rejected admin registration for: ${reg.email}`);
        } catch (e) {
            console.error(e);
            alert("Error rejecting user");
        }
    };

    const handleDeleteAdmin = async (uid: string) => {
        if (!confirm("Revoke access for this admin? This action is irreversible.")) return;

        const targetAdmin = admins.find(a => a.uid === uid);
        const targetEmail = targetAdmin?.email || uid;

        setLoading(true);
        await deleteAdmin(uid);

        const adminName = profile?.displayName || "CTO";
        await logActivity(profile?.uid!, adminName, `Revoked access for admin: ${targetEmail}`);
    };

    const handleRoleChange = async (targetUid: string, newRole: string) => {
        if (!confirm(`Change role to ${newRole}? Constraints will be checked.`)) return;
        try {
            // Needed to import updateAdminRole
            await updateAdminRole(targetUid, newRole, profile?.uid, profile?.displayName || "Admin");
            alert("Role updated successfully!");
            setEditingAdmin(null);
        } catch (e: any) {
            console.error(e);
            alert("Failed: " + e.message);
        }
    };

    // Helper to calculate tenure end
    const getTenureEnd = (start?: any) => {
        if (!start) return "N/A";
        const date = start.toDate();
        date.setFullYear(date.getFullYear() + 2);
        return date.toLocaleDateString();
    };

    // Strict CTO Check - MOVED AFTER HOOKS
    if (profile?.role !== "CTO") {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <Shield size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-400 max-w-md">
                    Only the CTO can manage team access and approve new admins.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Team Access</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <User size={18} /> Create New Admin
                </button>
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-white">Create New Admin</h2>

                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={createForm.email}
                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={createForm.password}
                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                    placeholder="Min. 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Role</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none appearance-none"
                                    value={createForm.role}
                                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                >
                                    {ROLES.filter(r => r !== "CTO").map(r => ( // CTO shouldn't create another CTO easily
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50"
                                >
                                    {loading ? "Creating..." : "Create Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Pending Requests */}
            <div className="mb-12">
                <h2 className="text-xl font-bold mb-4 text-yellow-500 flex items-center gap-2">
                    <Shield size={20} /> Pending Requests
                </h2>
                <div className="space-y-4">
                    {(() => {
                        // Merge pending_registrations and admins with role="pending"
                        const combinedPending = [...pendingRegs];
                        admins.filter(a => a.role === "pending").forEach(a => {
                            if (!combinedPending.find(p => p.email === a.email || p.id === a.uid)) {
                                combinedPending.push({
                                    id: a.uid,
                                    email: a.email,
                                    requestedAt: a.createdAt
                                });
                            }
                        });

                        if (combinedPending.length === 0) {
                            return <p className="text-gray-500 italic">No pending requests.</p>;
                        }

                        return combinedPending.map(reg => (
                            <div key={reg.id} className="bg-white/5 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold">{reg.email}</p>
                                    <p className="text-xs text-gray-400">Request Date: {reg.requestedAt?.toDate ? reg.requestedAt.toDate().toLocaleDateString() : new Date(reg.requestedAt?.seconds * 1000).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(reg)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(reg)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Active Admins */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-blue-500 flex items-center gap-2">
                    <User size={20} /> Active Team
                </h2>

                {/* Role Key */}
                <div className="mb-4 text-xs text-gray-400 flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> CTO can edit/remove members</span>
                </div>

                <div className="space-y-4">
                    {admins.filter(u => u.status === "active").map(admin => (
                        <div key={admin.uid} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold">{admin.email}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${admin.role === 'CTO' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                        {admin.role}
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-gray-400">
                                    <span>UID: {admin.uid.slice(0, 8)}...</span>
                                    {admin.approvedAt && (
                                        <span className="text-orange-400">Tenure Ends: {getTenureEnd(admin.approvedAt)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">

                                {/* CTO Role Editor */}
                                {profile?.role === 'CTO' && profile.uid !== admin.uid && (
                                    <div className="relative group">
                                        <select
                                            className="bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer pr-8"
                                            value={admin.role}
                                            onChange={(e) => handleRoleChange(admin.uid, e.target.value)}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                                    </div>
                                )}

                                {/* Only CTO can delete other admins */}
                                {profile?.role === "CTO" && profile?.uid !== admin.uid && (
                                    <button
                                        onClick={() => handleDeleteAdmin(admin.uid)}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors bg-white/5 rounded-lg"
                                        title="Revoke Access"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {admins.filter(u => u.status === "active").length === 0 && (
                        <p className="text-gray-500">No active admins found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
