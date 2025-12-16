import { Metadata } from "next";
import { getGallery } from "@/lib/api";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
    title: "Gallery | ReLU",
    description: "Memories from ReLU events and workshops.",
};

export const revalidate = 0;

export default async function GalleryPage() {
    const images = await getGallery();
    return <GalleryClient images={images} />;
}
