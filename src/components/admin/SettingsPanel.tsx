"use client";

import { useState, useEffect } from "react";
import { getOnboardingConfig, updateOnboardingConfig, OnboardingConfig } from "@/lib/api";
import { Plus, Trash2, Save, Settings, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface SettingsPanelProps {
    onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
    const [config, setConfig] = useState<OnboardingConfig>({ classes: [], sections: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newItem, setNewItem] = useState({ type: "", value: "" });
    const { toast } = useToast();

    useEffect(() => {
        fetchConfig();
    }, []);

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
    };

    const handleRemoveItem = (type: "classes" | "sections", value: string) => {
        const updatedList = config[type].filter(item => item !== value);
        setConfig({ ...config, [type]: updatedList });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOnboardingConfig(config);
            toast("Configuration saved successfully!", "success");
        } catch (e: any) {
            console.error(e);
            toast("Failed to save configuration: " + e.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-mono text-blue-400">/settings</h2>
                    <span className="text-gray-500 text-sm">(System Configuration)</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 text-white bg-black/20">
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

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
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

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
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
                                        const { archiveOldLogs } = await import("@/services/audit");
                                        const count = await archiveOldLogs(30);
                                        toast(`Archived ${count} old log entries.`, "success");
                                    } catch (e: any) {
                                        toast("Error archiving logs: " + e.message, "error");
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
        </div>
    );
}
