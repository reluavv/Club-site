
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvents, getEventGallery, addToGallery, deleteFromGallery, uploadImage, logActivity } from "@/lib/api";
import { Event, GalleryImage } from "@/types";
import { ArrowLeft, Trash2, Plus, Upload, Play, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";

export default function EventGalleryManager() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { profile } = useAuth();
    // Note: in recent nextjs app dir, params are passed as props to page, but using useParams hook works in client component.

    const [event, setEvent] = useState<Event | null>(null);
    const [gallery, setGallery] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image'); // Default to image for now

    const loadData = useCallback(async () => {
        if (!eventId) return;
        try {
            const allEvents = await getEvents();
            const found = allEvents.find(e => e.id === eventId);
            setEvent(found || null);

            const media = await getEventGallery(eventId);
            setGallery(media);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        loadData();
    }, [eventId, loadData]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !event) return;

        setUploading(true);
        setProgress(0);
        try {
            // 1. Upload file to Storage
            const url = await uploadImage(file, `gallery/${event.id}`, (p) => setProgress(p));

            // 2. Add to Firestore
            await addToGallery({
                src: url,
                alt: `${event.title} - ${mediaType}`,
                eventId: event.id,
                type: mediaType,
                category: "event"
            });
            const adminName = profile?.displayName || "Admin";
            await logActivity(profile?.uid!, adminName, `Uploaded ${mediaType} to gallery: ${event.title}`);

            // 3. Reset
            setFile(null);
            loadData(); // Refresh gallery

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. See console.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteFromGallery(id);
            // Ideally also delete from storage, but requires tracking storage path/ref separately or extracting from URL
            if (event) {
                const adminName = profile?.displayName || "Admin";
                await logActivity(profile?.uid!, adminName, `Deleted image from gallery: ${event.title}`);
            }
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-white"><Loader2 className="animate-spin" /> Loading...</div>;
    if (!event) return <div className="p-8 text-white">Event not found</div>;

    return (
        <div className="max-w-6xl mx-auto text-white">
            <Link href="/admin/gallery" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft size={18} /> Back to Events
            </Link>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        Gallery: <span className="text-blue-500">{event.title}</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">{gallery.length} items uploaded</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-12">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-green-500" /> Upload Media
                </h2>

                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select File</label>
                        <input
                            type="file"
                            accept="image/*,video/*,application/pdf"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                    setFile(f);
                                    // Auto-detect type
                                    if (f.type.startsWith('video')) setMediaType('video');
                                    else setMediaType('image');
                                }
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 file:bg-blue-600 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-4 file:text-xs font-mono"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Media Type</label>
                        <select
                            value={mediaType}
                            onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3.5 text-white focus:outline-none"
                        >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                    </div>

                    <div className="flex-col w-full md:w-auto flex gap-2">
                        {uploading && (
                            <div className="w-full md:w-[150px] h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className="w-full md:w-auto px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <><Plus size={18} /> Add to Gallery</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {gallery.map((media) => (
                    <div key={media.id} className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10 aspect-square">
                        {media.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/50">
                                <Play size={32} className="text-white/50" />
                                <video src={media.src} className="absolute inset-0 w-full h-full object-cover -z-10 opacity-60" />
                            </div>


                        ) : (
                            <Image src={media.src} alt="Gallery" fill className="object-cover" />
                        )}

                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button
                                onClick={() => handleDelete(media.id)}
                                className="p-2 bg-red-600 rounded-full hover:bg-red-500 text-white transition-transform hover:scale-110"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                            <a
                                href={media.src}
                                target="_blank"
                                className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-transform hover:scale-110"
                                title="View Original"
                            >
                                <ImageIcon size={18} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {gallery.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <p className="text-gray-500">No media uploaded for this event yet.</p>
                </div>
            )}
        </div>
    );
}
