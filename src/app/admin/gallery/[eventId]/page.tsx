"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getEvents, getEventGallery, addToGallery, deleteFromGallery, uploadImage, uploadGalleryToR2, checkR2Configured, logActivity } from "@/lib/api";
import { Event, GalleryImage } from "@/types";
import { ArrowLeft, Trash2, Upload, Play, Image as ImageIcon, HardDrive, CloudOff, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

// Gallery upload hard limit — kept in sync with src/lib/r2.ts (server re-validates).
const MAX_GALLERY_MB = 25;

export default function EventGalleryManager() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { profile } = useAuth();
    const toast = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [gallery, setGallery] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [r2Configured, setR2Configured] = useState<boolean | null>(null); // null = still checking
    const [missingKeys, setMissingKeys] = useState<string[]>([]);

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [acceptedType, setAcceptedType] = useState<'image' | 'video'>('image');
    const [fileUrl, setFileUrl] = useState<string>("");

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
        checkR2Configured()
            .then(res => {
                setR2Configured(!!res.r2Configured);
                setMissingKeys(res.missingKeys || []);
            })
            .catch(() => setR2Configured(false));
    }, [eventId, loadData]);

    useEffect(() => {
        // Clean up the object URL when the page unmounts.
        return () => { setFileUrl(prev => { if (prev) URL.revokeObjectURL(prev); return ""; }); };
    }, []);

    const handleFileChange = (f: File | undefined) => {
        if (!f) return;
        if (f.size > MAX_GALLERY_MB * 1024 * 1024) {
            toast.warning(`That file is too large. Maximum ${MAX_GALLERY_MB} MB.`);
            return;
        }
        if (f.type.startsWith('video')) setAcceptedType('video');
        else if (f.type.startsWith('image')) setAcceptedType('image');
        else if (f.type === 'application/pdf') { toast.warning("PDFs belong in Resources, not the photo gallery."); return; }
        else { toast.warning("Choose an image or a video file."); return; }
        setFile(f);
        setFileUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return f.type.startsWith('image') ? URL.createObjectURL(f) : "";
        });
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !event || uploading) return;

        setUploading(true);
        setProgress(0);
        try {
            let url: string;
            let storageKey: string | undefined;
            let storedSize: number | undefined;
            let lossless: boolean | undefined;

            if (r2Configured) {
                // R2 path: upload through the server route (admin-token verified,
                // lossless recompression applied server-side, credentials never leave the server).
                const res = await uploadGalleryToR2(file, event.id, (p) => setProgress(p));
                url = res.url;
                storageKey = res.key;
                storedSize = res.storedSize;
                lossless = res.lossless;
            } else {
                // Fallback when R2 is not configured: previous Firebase Storage upload.
                url = await uploadImage(file, `gallery/${event.id}`, (p) => setProgress(p));
            }

            await addToGallery({
                src: url,
                alt: `${event.title} - ${acceptedType}`,
                eventId: event.id,
                type: acceptedType,
                category: "event",
                ...(storageKey ? { storageKey, storedSize, storedLosslessly: lossless } : {}),
            });
            const adminName = profile?.displayName || "Admin";
            await logActivity(profile?.uid!, adminName, `Uploaded ${acceptedType} to gallery: ${event.title}`);

            setFile(null);
            setFileUrl("");
            loadData(); // Refresh gallery
        } catch (error) {
            console.error("Upload failed", error);
            toast.error(`${error instanceof Error ? error.message : "Upload failed."}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item permanently? The stored file will be removed as well.")) return;
        try {
            await deleteFromGallery(id);
            if (event) {
                const adminName = profile?.displayName || "Admin";
                await logActivity(profile?.uid!, adminName, `Deleted image from gallery: ${event.title}`);
            }
            loadData();
            toast.success("Gallery item deleted.");
        } catch (error) {
            console.error(error);
            toast.error("Could not delete this item. The storage service may be unavailable.");
        }
    };

    if (loading) return <div className="p-8 flex items-center gap-3 text-gray-400"><Loader2 className="animate-spin" size={20} /> Loading gallery…</div>;
    if (!event) return (
        <div className="max-w-2xl mx-auto text-center py-24 bg-white/5 rounded-2xl border border-white/10">
            <ImageIcon size={40} className="mx-auto text-gray-600 mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Event not found</h1>
            <p className="text-gray-400 text-sm mb-6">This gallery link points to an event that no longer exists.</p>
            <Link href="/admin/gallery" className="text-blue-400 hover:text-blue-300 text-sm font-medium">Back to all galleries</Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto text-white">
            <Link href="/admin/gallery" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={18} /> Back to Events
            </Link>

            <PageHeader
                title={`Gallery · ${event.title}`}
                subtitle={`${gallery.length} item${gallery.length === 1 ? "" : "s"} · opened per event`}
                icon={<ImageIcon size={26} />}
            />

            {/* R2 Status Banner */}
            {r2Configured === false && (
                <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl flex items-start gap-3 text-sm text-yellow-200/90" role="status">
                    <CloudOff size={18} className="mt-0.5 shrink-0 text-yellow-400" />
                    <div>
                        <p className="font-semibold text-yellow-300 mb-1">R2 object storage not configured</p>
                        <p>Uploads are falling back to legacy Firebase Storage. To store gallery media on Cloudflare R2 (free tier: 10 GB, zero egress), set {missingKeys.length ? missingKeys.join(", ") : "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL"} on the server and redeploy.</p>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                    <Upload size={18} className="text-blue-400" /> Upload Media
                </h2>
                <p className="text-xs text-gray-500 mb-5 flex items-center gap-1.5">
                    <Sparkles size={12} className={r2Configured ? "text-blue-400" : "text-gray-500"} />
                    {r2Configured
                        ? "Delivered from Cloudflare R2 · lossless compression applied to PNGs · originals unmodified"
                        : "Uploading to Firebase Storage (fallback)"}
                </p>

                <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
                    <div>
                        <label htmlFor="gallery-file" className="block text-xs font-bold text-gray-500 uppercase mb-2">Select File (max {MAX_GALLERY_MB} MB)</label>
                        <input
                            id="gallery-file"
                            type="file"
                            accept="image/*,video/mp4,video/webm"
                            onChange={(e) => handleFileChange(e.target.files?.[0])}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-400 focus:outline-none focus:border-blue-500 file:bg-blue-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 file:text-xs file:font-medium file:cursor-pointer"
                        />
                    </div>

                    <div className="w-full md:w-40">
                        <label htmlFor="gallery-media-type" className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                        <select
                            id="gallery-media-type"
                            value={acceptedType}
                            onChange={(e) => setAcceptedType(e.target.value as 'image' | 'video')}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full md:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading {progress}%</> : <><Upload size={16} /> Add to Gallery</>}
                    </button>
                </form>

                {uploading && (
                    <div className="mt-4 w-full h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                )}

                {file && !uploading && fileUrl && (
                    <div className="mt-4 flex items-center gap-4 p-3 bg-black/30 border border-white/10 rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fileUrl} alt={`Preview of ${file.name}`} className="h-16 w-24 object-cover rounded-md" />
                        <div className="min-w-0 text-sm">
                            <p className="truncate text-gray-200 font-medium">{file.name}</p>
                            <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB · ready to upload</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Gallery Grid */}
            {gallery.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {gallery.map((media) => (
                        <figure key={media.id} className="relative group bg-white/5 rounded-xl overflow-hidden border border-white/10 aspect-square">
                            {media.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/60">
                                    <Play size={32} className="text-white/60" />
                                    <video src={media.src} className="absolute inset-0 w-full h-full object-cover -z-10 opacity-50" preload="metadata" aria-hidden="true" />
                                </div>
                            ) : (
                                <Image src={media.src} alt={media.alt || "Gallery image"} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                            )}

                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    onClick={() => handleDelete(media.id)}
                                    className="p-2.5 bg-red-600 rounded-full hover:bg-red-500 text-white transition-transform hover:scale-110"
                                    title="Delete item"
                                    aria-label={`Delete: ${media.alt || "gallery item"}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                                <a
                                    href={media.src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-transform hover:scale-110"
                                    title="View original"
                                    aria-label={`View original: ${media.alt || "gallery item"}`}
                                >
                                    <ImageIcon size={16} />
                                </a>
                            </div>
                            {media.storageKey && (
                                <figcaption className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-blue-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <HardDrive size={10} /> R2{media.storedLosslessly ? " · lossless" : ""}
                                </figcaption>
                            )}
                        </figure>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <ImageIcon size={36} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium">No media uploaded for this event yet.</p>
                    <p className="text-gray-600 text-sm mt-1">Photos and videos added here appear on the event&apos;s public page.</p>
                </div>
            )}
        </div>
    );
}
