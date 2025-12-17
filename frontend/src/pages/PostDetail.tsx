import { useParams } from "react-router-dom";
import { usePostDetail } from "@/hooks/api/use-posts";
import { PostMainPost } from "@/components/post/PostMainPost";
import { useState, useRef } from "react"; // Import useRef
import { ActivityPopup } from "@/components/post/ActivityPopup";
import { Loader2, Image as ImageIcon, Smile, AtSign, Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PostDetail = () => {
    const { id } = useParams();
    const { data: postData, isLoading } = usePostDetail(id || "");
    const [showActivity, setShowActivity] = useState(false);

    // 1. TẠO STATE ĐỂ LƯU VỊ TRÍ ĐỨNG CỦA POPUP
    const [popupTop, setPopupTop] = useState(0);

    // 2. TẠO REF ĐỂ GẮN VÀO NÚT "VIEW ACTIVITY"
    const buttonRef = useRef<HTMLDivElement>(null);

    const COLORS = {
        bgPage: "bg-[#0A0E1A]",
        bgCard: "bg-[#1A1F2E]",
        bgInput: "bg-[#0D1520]",
        border: "border-[#374151]",
        textSec: "text-[#94a3b8]",
        primary: "text-[#2B7FFF]"
    };

    // Hàm xử lý khi bấm nút View Activity
    const handleToggleActivity = () => {
        if (!showActivity && buttonRef.current) {
            // Nếu đang mở popup -> Tính toán vị trí
            // getBoundingClientRect().top lấy vị trí so với mép trên trình duyệt
            // Trừ đi 80px (khoảng cách Topbar + padding) để nó khớp với container relative
            const rect = buttonRef.current.getBoundingClientRect();
            // 64px (Topbar) + 16px (Padding top) = 80px
            // Tuy nhiên container cha là relative bắt đầu từ pt-16, nên ta lấy rect.top trừ đi khoảng 70-80px là đẹp
            setPopupTop(rect.top - 70);
        }
        setShowActivity(!showActivity);
    };

    if (isLoading) return <div className={`flex justify-center h-screen items-center ${COLORS.bgPage} pt-16`}><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
    if (!postData) return <div className={`text-center text-white pt-32 ${COLORS.bgPage} min-h-screen font-medium`}>Post not found</div>;

    return (
        <div className={`h-screen ${COLORS.bgPage} text-white flex justify-center pt-16 overflow-hidden`}>

            {/* Container Relative để Popup căn theo thằng này */}
            <div className="relative w-full flex justify-center h-full py-4">

                {/* === CARD BÀI VIẾT CHÍNH === */}
                <div className={`w-[700px] h-full ${COLORS.bgCard} rounded-[32px] border ${COLORS.border} shadow-2xl flex flex-col z-10 relative overflow-hidden`}>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">

                        {/* Bài Post */}
                        <PostMainPost data={postData} onViewActivity={handleToggleActivity} />

                        {/* --- HEADER CHỨA NÚT VIEW ACTIVITY --- */}
                        {/* Gắn ref vào đây để đo vị trí */}
                        <div
                            ref={buttonRef}
                            className={`flex justify-between items-center px-6 py-3 border-t ${COLORS.border} bg-[#1A1F2E]/95 backdrop-blur-sm sticky top-0 z-20`}
                        >
                            <span className="font-bold text-white text-base">Top</span>
                            <button
                                onClick={handleToggleActivity}
                                className={`${COLORS.primary} hover:underline flex items-center gap-1 font-medium text-sm`}
                            >
                                View activity &rarr;
                            </button>
                        </div>

                        {/* --- DANH SÁCH COMMENT --- */}
                        <div className={`${COLORS.bgCard} pt-2`}>
                            {(postData as any).replies && (postData as any).replies.length > 0 ? (
                                (postData as any).replies.map((reply: any) => (
                                    <div key={reply.id} className="flex gap-4 px-6 group">
                                        <div className="flex flex-col items-center shrink-0">
                                            <Avatar className={`w-10 h-10 border ${COLORS.border} z-10`}>
                                                <AvatarImage src={reply.author.avatar} />
                                                <AvatarFallback>{reply.author.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="w-[2px] grow bg-[#374151] mt-2 mb-2 rounded-full opacity-50 group-last:hidden"></div>
                                        </div>

                                        <div className="flex-1 pb-8">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-[15px] text-white">{reply.author.name}</span>
                                                <span className="text-[#64748b] text-sm">@{reply.author.username}</span>
                                                <span className="text-[#64748b] text-xs">• 2h</span>
                                            </div>
                                            <div className="text-[#e2e8f0] text-[15px] leading-relaxed mb-3 font-normal whitespace-pre-wrap">
                                                {reply.content}
                                            </div>
                                            {reply.gallery && reply.gallery.length > 0 && (
                                                <div className="mb-3 rounded-xl overflow-hidden border border-[#374151]">
                                                    <img src={reply.gallery[0].url} alt="" className="w-full h-auto object-cover max-h-[300px]" />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-6 text-[#64748b]">
                                                <button className="flex items-center gap-1.5 hover:text-rose-500 transition-colors group/icon">
                                                    <Heart size={18} /> <span className="text-xs font-medium group-hover/icon:text-rose-500">{reply.actions_count || 0}</span>
                                                </button>
                                                <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group/icon">
                                                    <MessageCircle size={18} /> <span className="text-xs font-medium group-hover/icon:text-blue-500">{reply.replies_count || 0}</span>
                                                </button>
                                                <button className="hover:text-green-500 transition-colors"><Repeat2 size={18} /></button>
                                                <button className="hover:text-blue-400 transition-colors"><Send size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={`p-10 text-center ${COLORS.textSec} text-sm`}>No replies yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Input Bar */}
                    <div className={`p-4 px-6 ${COLORS.bgCard} border-t ${COLORS.border} shrink-0`}>
                        <div className="flex items-center gap-3">
                            <Avatar className={`w-9 h-9 border ${COLORS.border}`}>
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>Me</AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 ${COLORS.bgInput} rounded-full flex items-center px-4 py-2.5 border ${COLORS.border} focus-within:border-[#64748b] transition-all`}>
                                <input type="text" placeholder={`Reply to ${postData.author.name}...`} className="bg-transparent border-none outline-none text-white text-[15px] w-full placeholder:text-[#64748b] font-normal" />
                            </div>
                            <div className={`flex gap-3 ${COLORS.textSec} items-center`}>
                                <button className="hover:text-white transition"><ImageIcon size={22} /></button>
                                <button className="hover:text-white transition"><AtSign size={22} /></button>
                                <button className="hover:text-white transition"><Smile size={22} /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === ACTIVITY POPUP === */}
                {showActivity && (
                    // Dùng style={{ top: popupTop }} để gán vị trí động
                    <div
                        className="absolute left-[calc(50%+360px)] w-[320px] animate-in fade-in zoom-in-95 duration-200 origin-top-left z-20"
                        style={{ top: `${popupTop}px` }}
                    >
                        <ActivityPopup
                            data={postData.activity}
                            onClose={() => setShowActivity(false)}
                        />
                    </div>
                )}

            </div>
        </div>
    );
};

export default PostDetail;