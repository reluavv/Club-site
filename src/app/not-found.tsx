import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background stars (using global CSS animation if available, or simple static fallback) */}
            <div className="absolute inset-0 bg-black z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#000] to-black opacity-80" />
            </div>

            <div className="relative z-10 text-center px-4">
                <h1 className="text-[150px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse">
                    404
                </h1>
                <h2 className="text-3xl font-bold text-white mb-6">Lost in Space?</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-8 text-lg">
                    The page you are looking for has drifted into a black hole or never existed in this dimension.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all hover:scale-105"
                >
                    <i className="fas fa-rocket"></i>
                    <span>Return to Base</span>
                </Link>
            </div>

            {/* Decorative Planet */}
            <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
}
