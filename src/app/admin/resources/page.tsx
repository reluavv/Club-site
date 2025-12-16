
"use client";

import { useEffect, useState } from "react";
import { getResources, createResource, deleteResource, Resource } from "@/lib/api";
import { Trash2, Plus, ExternalLink, FileText, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import FileUpload from "@/components/ui/FileUpload";
import { useAuth } from "@/lib/auth"; // For Activity Log, ideally
import { logActivity } from "@/lib/api";
import Image from "next/image";

export default function AdminResourcesPage() {
    const { profile } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Omit<Resource, "id">>({
        title: "",
        description: "",
        category: "AIML",
        type: "url",
        url: "",
        thumbnailUrl: ""
    });

    useEffect(() => {
        loadResources();
    }, []);
    // ... (skipping lines for brevity in instruction, actual tool call uses line numbers)
    // Note: I will just replace the state init and the select options separately or together if close.
    // They are far apart (lines 22 and 124). I'll do two edits or use multi_replace.
    // Using multi_replace is better.

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        const data = await getResources();
        setResources(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.url) {
            alert("Please fill in all required fields.");
            return;
        }

        if (formData.type === "url" && !formData.thumbnailUrl) {
            alert("Please upload a thumbnail for the link.");
            return;
        }

        // If type is image, url IS the image. If PDF, url IS the PDF.
        // If URL, url IS the link, thumbnail is separate.

        setLoading(true);
        await createResource(formData);

        const adminName = profile?.displayName || "Admin";
        await logActivity(profile?.uid!, adminName, `Added resource: ${formData.title}`);

        await loadResources();
        setIsCreating(false);
        // Reset form
        setFormData({
            title: "",
            description: "",
            category: "AIML",
            type: "url",
            url: "",
            thumbnailUrl: ""
        });
        setLoading(false);
    };

    const handleDelete = async (resource: Resource) => {
        if (!confirm(`Are you sure you want to delete "${resource.title}"?`)) return;
        setLoading(true);
        await deleteResource(resource.id);

        const adminName = profile?.displayName || "Admin";
        await logActivity(profile?.uid!, adminName, `Deleted resource: ${resource.title}`);

        await loadResources();
    };

    return (
        <div className="max-w-4xl mx-auto text-white">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Manage Resources</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={20} /> Add Resource
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl animate-in slide-in-from-top-4">
                    <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Add New Resource</h2>
                    <form onSubmit={handleCreate} className="space-y-6">

                        {/* 1. Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-blue-500 outline-none"
                                    placeholder="Resource Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as "AIML" | "DSA" })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-blue-500 outline-none"
                                >
                                    <option value="AIML">AI / Machine Learning</option>
                                    <option value="DSA">Data Structures & Algo</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-blue-500 outline-none"
                                rows={3}
                                placeholder="Brief description of the resource..."
                            />
                        </div>

                        {/* 2. Type Selection */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Resource Type</label>
                            <div className="grid grid-cols-3 gap-4">
                                {(['url', 'image', 'pdf'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type, url: "", thumbnailUrl: "" })}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${formData.type === type
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                            }`}
                                    >
                                        {type === 'url' && <LinkIcon size={18} />}
                                        {type === 'image' && <ImageIcon size={18} />}
                                        {type === 'pdf' && <FileText size={18} />}
                                        <span className="capitalize">{type === 'url' ? 'Link / URL' : type.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Conditional Inputs */}
                        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                            {formData.type === 'url' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">External Link</label>
                                        <input
                                            required
                                            value={formData.url}
                                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-blue-500 outline-none font-mono text-sm"
                                            placeholder="https://example.com/article"
                                        />
                                    </div>
                                    <FileUpload
                                        label="Thumbnail Image"
                                        path="resource-thumbnails"
                                        accept="image/*"
                                        type="image"
                                        currentUrl={formData.thumbnailUrl}
                                        onUpload={(url) => setFormData(prev => ({ ...prev, thumbnailUrl: url }))}
                                    />
                                </div>
                            )}

                            {formData.type === 'image' && (
                                <FileUpload
                                    label="Upload Image Resource"
                                    path="resources/images"
                                    accept="image/*"
                                    type="image"
                                    currentUrl={formData.url}
                                    onUpload={(url) => setFormData(prev => ({ ...prev, url }))}
                                />
                            )}

                            {formData.type === 'pdf' && (
                                <FileUpload
                                    label="Upload PDF Document"
                                    path="resources/pdfs"
                                    accept="application/pdf"
                                    type="pdf"
                                    currentUrl={formData.url}
                                    onUpload={(url) => setFormData(prev => ({ ...prev, url }))}
                                />
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Add Resource"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {resources.map((res) => (
                    <div key={res.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start justify-between group hover:bg-white/10 transition-colors">
                        <div className="flex gap-4">


                            {/* Icon or Thumbnail */}
                            <div className="relative w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                                {res.type === 'image' ? (
                                    <Image src={res.url} alt={res.title} fill className="object-cover" />
                                ) : res.type === 'pdf' ? (
                                    <FileText className="text-red-400" />
                                ) : res.thumbnailUrl ? (
                                    <Image src={res.thumbnailUrl} alt={res.title} fill className="object-cover" />
                                ) : (
                                    <LinkIcon className="text-blue-400" />
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg">{res.title}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/5">{res.category}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">{res.type}</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-2">{res.description}</p>
                                <a href={res.url} target="_blank" className="text-blue-400 text-xs hover:underline flex items-center gap-1 font-mono break-all max-w-md">
                                    {res.url} <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(res)}
                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete Resource"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}

                {!loading && resources.length === 0 && (
                    <div className="text-center py-20 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <p>No resources found.</p>
                        <p className="text-sm mt-1">Click &quot;Add Resource&quot; to upload your first item.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
