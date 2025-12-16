import { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI/ML | ReLU",
    description: "Artificial Intelligence and Machine Learning Domain.",
};

export default function AIMLPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-32 md:pt-36 text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">AI & Machine Learning</h1>
            <p className="text-xl text-gray-400 max-w-2xl">
                Exploring the frontiers of intelligence. Workshops, research, and coding sessions coming soon.
            </p>
        </div>
    );
}
