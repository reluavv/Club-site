import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AnalyticsListener from "@/components/AnalyticsListener";
import { APP_METADATA } from "@/lib/constants";
import Providers from "./providers";


const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
    metadataBase: new URL(APP_METADATA.SITE_URL),
    title: {
        template: `%s | ${APP_METADATA.SITE_NAME}`,
        default: APP_METADATA.SITE_NAME,
    },
    description: APP_METADATA.SITE_DESCRIPTION,
    keywords: ["AI", "Machine Learning", "Student Club", "ReLU", "Deep Learning", "Tech Community"],
    authors: [{ name: "ReLU Tech Team" }],
    openGraph: {
        title: APP_METADATA.SITE_NAME,
        description: "Join the community of AI enthusiasts. Workshops, Hackathons, and more.",
        url: APP_METADATA.SITE_URL,
        siteName: "ReLU",
        images: [
            {
                url: "/images/hero-logo.png",
                width: 800,
                height: 600,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ReLU - AI&ML Club",
        description: "Refining Logic and Unleashing AI.",
        images: ["/images/hero-logo.png"],
    },
    verification: {
        // google: "google-site-verification=YOUR_CODE_HERE", // TODO: Replace with actual verification code
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
            </head>
            <body className={`${outfit.variable} ${spaceGrotesk.variable} font-sans`}>
                <Providers>
                    <AnalyticsListener />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
