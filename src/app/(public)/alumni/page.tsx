import { Construction } from "lucide-react";

export default function AlumniPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-8 animate-pulse">
                <Construction size={48} />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Alumni Network
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
                We are building a dedicated space to honor and connect with our past members.
                Stay tuned for the launch of our Alumni portal.
            </p>
            <div className="flex gap-4 items-center justify-center">
                <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-500 font-mono">
                    Status: Under Construction
                </span>
            </div>
        </div>
    );
}
