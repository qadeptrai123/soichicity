import { Button } from "@/components/ui/button";
import { X, Heart, Repeat2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { usePostActivity } from "@/hooks/api/use-posts";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UserListItem } from "@/components/UserListItem";

interface ActivityPopupProps {
    postId: string;
    onClose: () => void;
}

export const ActivityPopup = ({ postId, onClose }: ActivityPopupProps) => {
    const { data, isLoading } = usePostActivity(postId, true);
    const [activeTab, setActiveTab] = useState<"likes" | "reposts" | null>(null);

    const BG_POPUP = "bg-[#1A1F2E]";
    const BORDER = "border-[#374151]";
    const TEXT_SEC = "text-[#94a3b8]";

    const likesCount = data?.likes?.length || 0;
    const repostsCount = data?.reposts?.length || 0;

    const renderList = () => {
        const list = activeTab === "likes" ? data?.likes : data?.reposts;

        if (!list || list.length === 0) {
            return <div className="text-center text-[#64748b] py-8 text-sm">No {activeTab} yet</div>;
        }

        return (
            <div className="space-y-1">
                {list.map((item: any) => (
                    <div key={item.user.uid}>
                        <UserListItem user={item.user} />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`w-full max-h-[600px] ${BG_POPUP} border ${BORDER} rounded-3xl flex flex-col shadow-2xl overflow-hidden`}>

            {/* Header */}
            <div className={`px-4 py-3 flex justify-between items-center border-b ${BORDER}`}>
                <div className="flex items-center gap-2">
                    {activeTab && (
                        <Button variant="ghost" size="icon" onClick={() => setActiveTab(null)} className={`h-6 w-6 ${TEXT_SEC} hover:text-white mr-1 p-0`}>
                            <ChevronRight size={20} className="rotate-180" />
                        </Button>
                    )}
                    <span className="text-sm font-semibold text-[#64748b]">
                        {activeTab ? (activeTab === "likes" ? "Likes" : "Reposts") : "Activity"}
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className={`h-6 w-6 ${TEXT_SEC} hover:text-white`}>
                    <X size={16} />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoadingSpinner />
                    </div>
                ) : !activeTab ? (
                    /* Display Stats Menu */
                    <div className="flex flex-col gap-1 p-4">
                        <div
                            onClick={() => setActiveTab("likes")}
                            className={`flex justify-between items-center p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group`}
                        >
                            <div className={`flex items-center gap-3 ${TEXT_SEC} group-hover:text-white`}>
                                <Heart size={20} /> <span className="text-base font-medium">Likes</span>
                            </div>
                            <div className="flex items-center gap-2 text-white font-bold">
                                {likesCount} <ChevronRight size={16} className="text-[#64748b]" />
                            </div>
                        </div>
                        <div
                            onClick={() => setActiveTab("reposts")}
                            className={`flex justify-between items-center p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group`}
                        >
                            <div className={`flex items-center gap-3 ${TEXT_SEC} group-hover:text-white`}>
                                <Repeat2 size={20} /> <span className="text-base font-medium">Reposts</span>
                            </div>
                            <div className="flex items-center gap-2 text-white font-bold">
                                {repostsCount} <ChevronRight size={16} className="text-[#64748b]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Display List */
                    <div>
                        {renderList()}
                    </div>
                )}
            </div>
        </div>
    );
};