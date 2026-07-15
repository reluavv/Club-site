import ResourceCard from "@/components/ui/ResourceCard";
import ResourceCategoryTabs from "@/components/public/ResourceCategoryTabs";
import { Metadata } from "next";
import { getResources } from "@/lib/api";

export const metadata: Metadata = {
    title: "Learning Resources | ReLU",
    description: "Curated collection of AI/ML and DSA resources for all levels.",
};

export const revalidate = 0;

export default async function ResourcesPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const allResources = await getResources();
    const category = searchParams?.category;

    // Default to AIML if no category specified
    const activeCategory = (category && typeof category === 'string') ? category : "AIML";
    const resources = allResources.filter(r => r.category === activeCategory);

    const displayTitle = activeCategory === "AIML" ? "AI / ML Resources" : "DSA Resources";
    const displaySubtitle = activeCategory === "AIML"
        ? "Explore curated materials for Artificial Intelligence & Machine Learning."
        : "Master Data Structures & Algorithms with hand-picked resources.";

    return (
        <div className="min-h-screen pt-32 md:pt-36 pb-20 relative z-[1]">
            {/* Header */}
            <div className="text-center mb-8 relative">
                <h1 className="text-[3rem] md:text-[4rem] text-white uppercase tracking-[10px] font-bold animate-[aurora_8s_linear_infinite] relative inline-block">
                    {displayTitle}
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-blue-500/20 blur-[50px] rounded-full -z-10" />
                </h1>
                <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto px-4">
                    {displaySubtitle}
                </p>
            </div>

            {/* Category Tabs */}
            <ResourceCategoryTabs />

            {/* Grid */}
            <div className="max-w-[1400px] mx-auto px-6 pb-20">
                {resources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xl text-gray-400">No {activeCategory === "AIML" ? "AI/ML" : "DSA"} resources available yet.</p>
                        <p className="text-sm text-gray-500 mt-2">Check back later for updates!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
