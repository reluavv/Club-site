import { Metadata } from "next";
import { getGallery, getEvents } from "@/lib/api";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
    title: "Gallery | ReLU",
    description: "Memories from ReLU events and workshops.",
};

export const revalidate = 0;

export default async function GalleryPage() {
    const [images, events] = await Promise.all([
        getGallery(),
        getEvents()
    ]);
    return <GalleryClient images={images} events={events} />;
}
