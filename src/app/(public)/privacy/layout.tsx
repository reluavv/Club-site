import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How the ReLU website collects and uses your data.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
