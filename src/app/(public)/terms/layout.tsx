import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms for using the ReLU club website.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
