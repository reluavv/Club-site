import { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Profile",
    description: "Your ReLU student profile.",
    robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
