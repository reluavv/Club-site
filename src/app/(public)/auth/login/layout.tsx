import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your ReLU account to register for events.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
