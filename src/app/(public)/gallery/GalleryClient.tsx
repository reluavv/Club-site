"use client";

import { GalleryImage } from "@/lib/api";
// import { Dialog, DialogContent } from "@/components/ui/dialog"; // Removed
import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";

interface GalleryClientProps {
    images: GalleryImage[];
}

export default function GalleryClient({ images }: GalleryClientProps) {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    return (
        <div className="min-h-screen pt-32 md:pt-36 pb-20 relative z-[1]">
            <div className="text-center mb-12 relative">
                <h1 className="text-[3rem] md:text-[4rem] text-white uppercase tracking-[10px] font-bold animate-[aurora_8s_linear_infinite] relative inline-block">
                    Gallery
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-pink-500/20 blur-[50px] rounded-full -z-10" />
                </h1>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 pb-20">
                {images.length > 0 ? (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer"
                                onClick={() => setSelectedImage(image)}
                            >
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    width={0}
                                    height={0}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="text-white w-10 h-10 drop-shadow-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xl text-gray-400">Gallery is empty.</p>
                        <p className="text-sm text-gray-500 mt-2">More memories coming soon!</p>
                    </div>
                )}
            </div>

            {/* Lightbox Modal - Custom Simple Implementation */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-[110]">
                        <X size={32} />
                    </button>
                    <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
                        <Image
                            src={selectedImage.src}
                            alt={selectedImage.alt}
                            fill
                            className="object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    {selectedImage.alt && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm backdrop-blur-sm">
                            {selectedImage.alt}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
