import Navbar from "@/components/layout/Navbar";
import StarBackground from "@/components/ui/StarBackground";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/ui/CookieConsent";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <a href="#main-content" className="skip-link">
                Skip to content
            </a>
            <StarBackground />
            <Navbar />
            <main id="main-content" className="min-h-screen relative flex flex-col">
                {children}
            </main>
            <Footer />
            <CookieConsent />
        </>
    );
}
