"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTeamMember, TeamMember } from "@/lib/api";
import ImageUpload from "@/components/ui/ImageUpload";

export default function AddTeamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Omit<TeamMember, "id" | "category">>({
        name: "",
        role: "",
        image: "",
        links: {
            linkedin: "",
            github: "",
            mail: ""
        }
    });
    const [type, setType] = useState<"core" | "mentors">("core");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createTeamMember(formData, type);
            router.push("/admin/team");
            router.refresh();
        } catch (error) {
            console.error("Failed to save team member", error);
            alert("Error saving team member");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/team" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <i className="fas fa-arrow-left"></i>
                </Link>
                <h1 className="text-3xl font-bold">Add Team Member</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-xl border border-white/10">

                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <ImageUpload
                        path="team-images"
                        currentImage={formData.image}
                        onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Role</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Section</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="core"
                                checked={type === 'core'}
                                onChange={() => setType('core')}
                                className="text-blue-500 bg-black/40 border-white/10"
                            />
                            <span className="text-white">Core Team</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="mentors"
                                checked={type === 'mentors'}
                                onChange={() => setType('mentors')}
                                className="text-blue-500 bg-black/40 border-white/10"
                            />
                            <span className="text-white">Mentor</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Social Links</label>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="LinkedIn URL"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.links.linkedin}
                            onChange={e => setFormData({ ...formData, links: { ...formData.links, linkedin: e.target.value } })}
                        />
                        <input
                            type="text"
                            placeholder="GitHub URL"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.links.github}
                            onChange={e => setFormData({ ...formData, links: { ...formData.links, github: e.target.value } })}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                    <Link href="/admin/team" className="px-6 py-3 rounded-lg text-gray-400 hover:text-white transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Add Member"}
                    </button>
                </div>
            </form>
        </div>
    );
}
