import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Heart, Repeat2, ChevronRight } from "lucide-react"; // Import ChevronRight
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

interface ActivityPopupProps {
    data: any[];
    onClose: () => void;
    isEmbedded?: boolean;
}

export const ActivityPopup = ({ data, onClose }: ActivityPopupProps) => {

    const BG_POPUP = "bg-[#1A1F2E]";
    const BORDER = "border-[#374151]";
    const TEXT_SEC = "text-[#94a3b8]";

    return (
        <div className={`w-full max-h-[600px] ${BG_POPUP} border ${BORDER} rounded-3xl flex flex-col shadow-2xl overflow-hidden`}>

            {/* Header - Ẩn nút đóng trên giao diện này cho giống Figma (hoặc để nhỏ) */}
            <div className={`p-4 pb-2 flex justify-between items-center`}>
                <span className="text-sm font-semibold text-[#64748b]">Activity</span>
                <Button variant="ghost" size="icon" onClick={onClose} className={`h-6 w-6 ${TEXT_SEC} hover:text-white`}>
                    <X size={16} />
                </Button>
            </div>

            {/* List Activity */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-0">

                {/* Stats Box */}
                <div className="flex flex-col gap-1 mb-4">
                    <div className={`flex justify-between items-center p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group`}>
                        <div className={`flex items-center gap-3 ${TEXT_SEC} group-hover:text-white`}>
                            <Heart size={20} /> <span className="text-base font-medium">Likes</span>
                        </div>
                        <div className="flex items-center gap-2 text-white font-bold">
                            127 <ChevronRight size={16} className="text-[#64748b]" />
                        </div>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group`}>
                        <div className={`flex items-center gap-3 ${TEXT_SEC} group-hover:text-white`}>
                            <Repeat2 size={20} /> <span className="text-base font-medium">Reposts</span>
                        </div>
                        <div className="flex items-center gap-2 text-white font-bold">
                            12 <ChevronRight size={16} className="text-[#64748b]" />
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className={`h-[1px] bg-[#374151] mx-2 mb-3`}></div>

                {/* User List */}
                <div className="space-y-1">
                    {data && data.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 px-3 hover:bg-white/5 rounded-xl transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className={`w-10 h-10 border ${BORDER}`}>
                                        <AvatarImage src={item.user.avatar_url || item.user.avatar || DEFAULT_AVATAR_URL} />
                                        <AvatarFallback>{item.user.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className={`absolute -bottom-1 -right-1 p-[3px] rounded-full ${BG_POPUP} ring-2 ring-[#1A1F2E] ${item.type === 'like' ? 'bg-rose-500 text-white' : 'bg-green-500 text-white'}`}>
                                        {item.type === 'like' ? <Heart size={8} fill="currentColor" /> : <Repeat2 size={8} />}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-white">{item.user.full_name}</span>
                                    <span className="text-xs text-[#64748b]">@{item.user.username}</span>
                                </div>
                            </div>
                            {/* NÚT FOLLOW TRẮNG CHỮ ĐEN */}
                            <button className="bg-white text-black text-sm font-bold px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                                Follow
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};