"use client";

import { useState } from "react";
import { saveRole, deleteRole } from "@/lib/api";
import { ClubRole, CTO_ROLE, DEFAULT_ROLE_ID, roleIdFromLabel } from "@/lib/roles";
import { useToast } from "@/components/ui/Toast";
import { Plus, Save, Trash2, Layers } from "lucide-react";

interface RolesManagerProps {
    roles: ClubRole[];
    holderCount: (roleId: string) => number;
    actorUid?: string;
    actorName?: string;
}

const inputClass = "bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none";

// Seats are typed as text so "unlimited" can be an empty box.
const parseLimit = (value: string) => (value.trim() === "" ? null : Math.max(1, parseInt(value, 10) || 1));

export default function RolesManager({ roles, holderCount, actorUid, actorName }: RolesManagerProps) {
    const toast = useToast();
    const [drafts, setDrafts] = useState<Record<string, { label: string; rank: string; limit: string }>>({});
    const [newRole, setNewRole] = useState({ label: "", rank: "10", limit: "1" });

    const draftFor = (r: ClubRole) => drafts[r.id] ?? { label: r.label, rank: String(r.rank), limit: r.limit === null ? "" : String(r.limit) };
    const setDraft = (r: ClubRole, patch: Partial<{ label: string; rank: string; limit: string }>) =>
        setDrafts(d => ({ ...d, [r.id]: { ...draftFor(r), ...patch } }));

    const run = async (action: () => Promise<void>, success: string) => {
        try {
            await action();
            toast.success(success);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleSave = (r: ClubRole) => {
        const d = draftFor(r);
        const limit = r.id === DEFAULT_ROLE_ID ? null : parseLimit(d.limit);
        if (limit !== null && holderCount(r.id) > limit) {
            toast.error(`${holderCount(r.id)} people already hold ${r.label}. Move someone out first.`);
            return;
        }
        run(async () => {
            await saveRole({ id: r.id, label: d.label, rank: Number(d.rank) || 0, limit }, actorUid, actorName);
            setDrafts(({ [r.id]: _, ...rest }) => rest);
        }, "Role saved");
    };

    const handleDelete = (r: ClubRole) => {
        if (!confirm(`Delete the ${r.label} role?`)) return;
        run(() => deleteRole(r.id, actorUid, actorName), "Role deleted");
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const id = roleIdFromLabel(newRole.label);
        if (!id) return toast.error("Give the role a name.");
        if (roles.some(r => r.id === id)) return toast.error("A role with that name already exists.");
        run(async () => {
            await saveRole({ id, label: newRole.label, rank: Number(newRole.rank) || 0, limit: parseLimit(newRole.limit) }, actorUid, actorName);
            setNewRole({ label: "", rank: "10", limit: "1" });
        }, "Role added");
    };

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold mb-2 text-purple-400 flex items-center gap-2">
                <Layers size={20} /> Club Roles
            </h2>
            <p className="text-xs text-gray-400 mb-4">
                Order sets where a role appears on the team pages (lowest first). Leave seats empty for unlimited.
            </p>

            <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-[1fr_80px_80px_70px_auto] gap-2 px-1 text-xs text-gray-500">
                    <span>Role</span><span>Order</span><span>Seats</span><span>Holders</span><span />
                </div>
                {roles.map(r => {
                    const d = draftFor(r);
                    const fixed = r.id === CTO_ROLE.id;
                    return (
                        <div key={r.id} className="grid grid-cols-[1fr_80px_80px_70px_auto] gap-2 items-center">
                            <input aria-label="Role name" className={inputClass} value={d.label} disabled={fixed}
                                onChange={e => setDraft(r, { label: e.target.value })} />
                            <input aria-label="Order" type="number" className={inputClass} value={d.rank} disabled={fixed}
                                onChange={e => setDraft(r, { rank: e.target.value })} />
                            <input aria-label="Seats" inputMode="numeric" className={inputClass} placeholder="∞"
                                value={d.limit} disabled={fixed || r.id === DEFAULT_ROLE_ID}
                                onChange={e => setDraft(r, { limit: e.target.value.replace(/\D/g, "") })} />
                            <span className="text-sm text-gray-400 text-center">{holderCount(r.id)}</span>
                            <div className="flex gap-1">
                                {!fixed && (
                                    <button onClick={() => handleSave(r)} disabled={!drafts[r.id]} title="Save"
                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-green-400 disabled:opacity-30">
                                        <Save size={16} />
                                    </button>
                                )}
                                {!fixed && r.id !== DEFAULT_ROLE_ID && (
                                    <button onClick={() => handleDelete(r)} title="Delete"
                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleAdd} className="mt-4 grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center">
                <input aria-label="New role name" className={inputClass} placeholder="New role, e.g. Events Lead"
                    value={newRole.label} onChange={e => setNewRole({ ...newRole, label: e.target.value })} />
                <input aria-label="New role order" type="number" className={inputClass}
                    value={newRole.rank} onChange={e => setNewRole({ ...newRole, rank: e.target.value })} />
                <input aria-label="New role seats" inputMode="numeric" className={inputClass} placeholder="∞"
                    value={newRole.limit} onChange={e => setNewRole({ ...newRole, limit: e.target.value.replace(/\D/g, "") })} />
                <button type="submit" className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-bold flex items-center gap-1">
                    <Plus size={16} /> Add
                </button>
            </form>
        </div>
    );
}
