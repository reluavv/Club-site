import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-start min-h-screen pt-32 md:pt-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-20">
            {/* Hero Image */}
            <div className="relative w-full max-w-[320px] md:max-w-[700px] lg:max-w-[900px] aspect-[3/1] mb-8 animate-[fadeIn_1s_ease-out]">
                <Image
                    src="/images/light_text_logo.png"
                    alt="ReLU Logo"
                    fill
                    className="object-contain drop-shadow-[0_0_25px_rgba(108,92,231,0.5)]"
                    priority
                />
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-3xl lg:text-4xl text-gray-300 font-light tracking-[0.2em] uppercase mb-12 animate-[slideUp_1s_ease-out_0.3s_both] drop-shadow-lg">
                Refining Logic and Unleashing AI
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 animate-[slideUp_1s_ease-out_0.6s_both]">
                <Link
                    href="/events"
                    className="px-6 py-3 text-base md:px-8 md:py-4 md:text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transform hover:scale-105 transition-all duration-300 border border-white/20 backdrop-blur-sm"
                >
                    Explore Events
                </Link>
                <Link
                    href="/about"
                    className="px-6 py-3 text-base md:px-8 md:py-4 md:text-lg bg-white/5 border border-white/20 text-white rounded-full font-bold hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                >
                    Meet the Team
                </Link>
                <Link
                    href="/auth/signup"
                    className="px-6 py-3 text-base md:px-8 md:py-4 md:text-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transform hover:scale-105 transition-all duration-300 border border-white/20 backdrop-blur-sm"
                >
                    Join the Family
                </Link>
            </div>
        </div>
    );
}
