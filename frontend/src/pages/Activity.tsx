import { MOCK_ACTIVITIES } from "@/types/activity";
import ActivityItem from "@/components/ActivityItem";
import AnimateEntrance from "@/components/ui/AnimateEntrance";

export default function Activity() {
    return (
        <div className="w-full max-w-2xl mx-auto pb-20">

            {/* Activity List Card Container */}
            <AnimateEntrance>
                <div className="bg-secondary border border-border-secondary rounded-3xl overflow-hidden shadow-xl">

                    {/* Filter Tabs (Sticky Header) */}
                    <div className="sticky z-20 bg-secondary/95 backdrop-blur-sm border-b border-[#374151] py-2">
                        <div className="flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar">
                            {["All", "Follows", "Replies", "Mentions", "Reposts"].map((tab, i) => (
                                <button
                                    key={tab}
                                    className={`px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${i === 0
                                        ? 'bg-white text-black'
                                        : 'bg-transparent hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {MOCK_ACTIVITIES.map((activity, index) => (
                            <ActivityItem
                                key={activity.id}
                                item={activity}
                                isLast={index === MOCK_ACTIVITIES.length - 1}
                            />
                        ))}
                    </div>
                </div>
            </AnimateEntrance>
        </div>
    );
}
