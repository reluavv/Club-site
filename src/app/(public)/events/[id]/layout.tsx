import { Metadata } from "next";
import { getEvent } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const event = await getEvent(id);
    if (!event) return { title: "Event Not Found" };
    return { title: event.title, description: event.description };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
