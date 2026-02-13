import Navbar from "@/components/layout/Navbar";
import StarBackground from "@/components/ui/StarBackground";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <StarBackground />
            <Navbar />
            <main className="min-h-screen relative flex flex-col">
                {children}
            </main>
            <Footer />
        </>
    );
}
