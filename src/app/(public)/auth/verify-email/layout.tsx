import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Verify Your Email",
    description: "Confirm your email address to finish creating your ReLU account.",
    robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
