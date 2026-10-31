import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up",
    description: "Create a ReLU account with your Amrita student email.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
