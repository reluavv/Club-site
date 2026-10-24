import { Metadata } from "next";
import { getEvent } from "@/lib/api";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const event = await getEvent(params.id);
    if (!event) return { title: "Event Not Found" };
    return { title: event.title, description: event.description };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
