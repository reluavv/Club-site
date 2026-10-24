import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact",
    description: "Get in touch with the ReLU club at Amrita Vishwa Vidyapeetham, Amaravathi.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
