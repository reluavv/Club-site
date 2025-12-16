"use client";

import { GalleryImage, Event } from "@/lib/api";
// import { Dialog, DialogContent } from "@/components/ui/dialog"; // Removed
import { useState, useMemo } from "react";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";

interface GalleryClientProps {
    images: GalleryImage[];
    events: Event[];
}

export default function GalleryClient({ images, events }: GalleryClientProps) {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    // Group images by Event ID
    const groupedImages = useMemo(() => {
        const groups: Record<string, GalleryImage[]> = {};
        const uncategorized: GalleryImage[] = [];

        images.forEach(img => {
            if (img.eventId) {
                if (!groups[img.eventId]) groups[img.eventId] = [];
                groups[img.eventId].push(img);
            } else {
                uncategorized.push(img);
            }
        });

        // Create sorted sections based on Events (newest first)
        const sections = events
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(event => ({
                id: event.id,
                title: event.title,
                date: event.date,
                images: groups[event.id] || []
            }))
            .filter(section => section.images.length > 0); // Only show events with images

        // Add uncategorized if any
        if (uncategorized.length > 0) {
            sections.push({
                id: 'misc',
                title: 'Miscellaneous',
                date: '',
                images: uncategorized
            });
        }

        return sections;
    }, [images, events]);

    return (
        <div className="min-h-screen pt-32 md:pt-36 pb-20 relative z-[1]">
            <div className="text-center mb-16 relative">
                <h1 className="text-[3rem] md:text-[4rem] text-white uppercase tracking-[10px] font-bold animate-[aurora_8s_linear_infinite] relative inline-block">
                    Gallery
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-pink-500/20 blur-[50px] rounded-full -z-10" />
                </h1>
                <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                    Capturing moments of innovation and collaboration.
                </p>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-20">
                {groupedImages.length > 0 ? (
                    groupedImages.map((section) => (
                        <div key={section.id} className="animate-in slide-in-from-bottom-10 duration-700">
                            {/* Section Header */}
                            <div className="flex items-end gap-4 mb-8 border-b border-white/10 pb-4">
                                <h2 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                    {section.title}
                                </h2>
                                {section.date && (
                                    <span className="text-gray-500 font-mono text-sm mb-1">
                                        {new Date(section.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </span>
                                )}
                            </div>

                            {/* Masonry Grid for this Section */}
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                                {section.images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer bg-white/5 border border-white/5"
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        <Image
                                            src={image.src}
                                            alt={image.alt}
                                            width={500}
                                            height={300}
                                            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn className="text-white w-10 h-10 drop-shadow-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xl text-gray-400">Gallery is clean.</p>
                        <p className="text-sm text-gray-500 mt-2">Upload photos from Admin Panel to see them here!</p>
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110]">
                        <X size={40} />
                    </button>

                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col items-center justify-center">
                        <div className="relative w-full h-full">
                            <Image
                                src={selectedImage.src}
                                alt={selectedImage.alt}
                                fill
                                className="object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        {selectedImage.alt && (
                            <div className="mt-4 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white/90 font-medium">
                                {selectedImage.alt}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
