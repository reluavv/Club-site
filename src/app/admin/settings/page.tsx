"use client";

import { useState, useEffect } from "react";
import { getOnboardingConfig, updateOnboardingConfig, OnboardingConfig } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Settings, AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [config, setConfig] = useState<OnboardingConfig>({ classes: [], sections: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newItem, setNewItem] = useState({ type: "", value: "" });

    useEffect(() => {
        if (!authLoading) {
            if (profile?.role !== "CTO") {
                // router.push("/admin/dashboard"); // Or show unauthorized
                // For safety, we can just return null rendering, but redirection is better
            }
            fetchConfig();
        }
    }, [authLoading, profile]);

    const fetchConfig = async () => {
        const data = await getOnboardingConfig();
        setConfig(data);
        setLoading(false);
    };

    const handleAddItem = (type: "classes" | "sections") => {
        if (!newItem.value) return;

        const updatedList = [...config[type], newItem.value.toUpperCase()];
        const newConfig = { ...config, [type]: updatedList };

        setConfig(newConfig);
        setNewItem({ type: "", value: "" });

        // Auto-save or wait for manual save? Manual save is safer for config.
    };

    const handleRemoveItem = (type: "classes" | "sections", value: string) => {
        const updatedList = config[type].filter(item => item !== value);
        setConfig({ ...config, [type]: updatedList });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOnboardingConfig(config);
            // Success feedback
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) return <div className="p-8 text-white">Loading...</div>;

    if (profile?.role !== "CTO") {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-white">Access Denied</h1>
                <p className="text-gray-400">Only the Chief Technology Officer can access system settings.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto text-white p-4">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Settings className="text-blue-500" /> System Configuration
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Classes Config */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Brahmoc Classes / Branches</h2>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Add Class (e.g. AIE)"
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none uppercase"
                            value={newItem.type === "classes" ? newItem.value : ""}
                            onChange={(e) => setNewItem({ type: "classes", value: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddItem("classes")}
                        />
                        <button
                            onClick={() => handleAddItem("classes")}
                            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {config.classes.map((cls) => (
                            <div key={cls} className="flex justify-between items-center bg-white/5 p-3 rounded-lg group">
                                <span className="font-mono font-bold">{cls}</span>
                                <button
                                    onClick={() => handleRemoveItem("classes", cls)}
                                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sections Config */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Sections</h2>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Add Section (e.g. D)"
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none uppercase"
                            value={newItem.type === "sections" ? newItem.value : ""}
                            onChange={(e) => setNewItem({ type: "sections", value: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddItem("sections")}
                        />
                        <button
                            onClick={() => handleAddItem("sections")}
                            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {config.sections.map((sec) => (
                            <div key={sec} className="flex justify-between items-center bg-white/5 p-3 rounded-lg group">
                                <span className="font-mono font-bold">{sec}</span>
                                <button
                                    onClick={() => handleRemoveItem("sections", sec)}
                                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                    <AlertTriangle size={20} /> System Maintenance
                </h2>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-red-200">Archive Old Logs</h3>
                        <p className="text-sm text-gray-400">Delete audit logs older than 30 days to free up storage space.</p>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm("Are you sure you want to delete logs older than 30 days? This cannot be undone.")) {
                                try {
                                    // Import dynamically to avoid server/client issues if any
                                    const { archiveOldLogs } = await import("@/services/audit");
                                    const count = await archiveOldLogs(30);
                                    alert(`Archived ${count} old log entries.`);
                                } catch (e: any) {
                                    alert("Error archiving logs: " + e.message);
                                }
                            }
                        }}
                        className="px-6 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded-lg font-bold transition-all"
                    >
                        Archive Logs
                    </button>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                >
                    {saving ? "Saving Changes..." : <><Save size={20} /> Save Configuration</>}
                </button>
            </div>
        </div>
    );
}
