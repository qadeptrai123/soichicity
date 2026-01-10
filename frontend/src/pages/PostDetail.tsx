import { useParams } from "react-router-dom";
import { usePostDetail } from "@/hooks/api/use-posts";
import { PostMainPost } from "@/components/post/PostMainPost";
import React, { useState, useRef } from "react"; // Import useRef
import { ActivityPopup } from "@/components/post/ActivityPopup";
// import { Image as ImageIcon, Smile, AtSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TargetPost } from "@/types/post";
import ReplyCommentDialog from "@/components/comment";
import { useAuth } from "@/contexts/AuthProvider";
import { ReplyItem } from "@/components/post/ReplyItem";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import AnimateEntrance from "@/components/ui/AnimateEntrance";
import { LoginPrompt } from "@/components/LoginPrompt";
import EditPostDialog from "@/components/EditPostDialog";

const PostDetail = () => {
    const { id } = useParams();
    const { data: postData, isLoading } = usePostDetail(id || "");
    const [showActivity, setShowActivity] = useState(false);
    const { user, isAuthenticated } = useAuth();
    console.log(postData)
    // Reply Dialog State
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [selectedReply, setSelectedReply] = useState<TargetPost | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Edit Post State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<any | null>(null);

    const handleReplyClick = (reply: any) => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        const target: TargetPost = {
            id: reply.post_id,
            user: {
                uid: reply.author.uid,
                username: reply.author.username,
                full_name: reply.author.full_name,
                avatar_url: reply.author.avatar_url || reply.author.avatar || DEFAULT_AVATAR_URL,
            },
            content: reply.content,
            date: reply.created_at,
            media_url: reply.gallery?.[0] || reply.media_urls?.[0] || reply.media_url || null, // Priority: Gallery > MediaUrls > MediaUrl
            gallery: reply.gallery || reply.media_urls || undefined,
            level: (reply.level || 0),
        };
        setSelectedReply(target);
        setReplyDialogOpen(true);
    };

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

    if (isLoading) return (
        <div className={`flex justify-center items-start pt-12 ${COLORS.bgPage} h-[calc(100vh-64px)]`}>
            <LoadingSpinner />
        </div>
    );
    if (!postData) return <div className={`text-center text-white pt-1 ${COLORS.bgPage} min-h-screen font-medium`}>Post not found</div>;

    return (
        <div className={`h-[calc(100vh-64px)] ${COLORS.bgPage} text-white flex justify-center`}>

            {/* Container Relative */}
            <AnimateEntrance type="zoom" className="relative w-full flex justify-center h-full py-4">

                {/* === CARD BÀI VIẾT CHÍNH === */}
                <div className={`w-[700px] h-full ${COLORS.bgCard} rounded-[32px] border ${COLORS.border} shadow-2xl flex flex-col z-10 relative overflow-hidden`}>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-0">

                        {/* Bài Post */}
                        <PostMainPost
                            data={postData}
                            onViewActivity={handleToggleActivity}
                            onReply={() => handleReplyClick(postData)}
                            onEdit={(post) => {
                                setEditingPost(post);
                                setIsEditOpen(true);
                            }}
                        />

                        {/* --- HEADER CHỨA NÚT VIEW ACTIVITY --- */}
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
                            {postData.replies && postData.replies.length > 0 ? (
                                postData.replies.map((reply: any) => (
                                    <React.Fragment key={reply.post_id}>
                                        <ReplyItem
                                            reply={reply}
                                            onReplyClick={handleReplyClick}
                                        />
                                    </React.Fragment>
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
                                <AvatarImage src={user?.avatar_url || user?.avatar || DEFAULT_AVATAR_URL} />
                                <AvatarFallback>Me</AvatarFallback>
                            </Avatar>
                            <div
                                className={`flex-1 ${COLORS.bgInput} rounded-full flex items-center px-4 py-2.5 border ${COLORS.border} focus-within:border-[#64748b] transition-all cursor-pointer`}
                                onClick={() => handleReplyClick(postData)}
                            >
                                <input type="text" placeholder={`Reply to ${postData.author?.full_name || postData.author?.username || 'User'}...`} className="bg-transparent border-none outline-none text-white text-[15px] w-full placeholder:text-[#64748b] font-normal pointer-events-none" readOnly />
                            </div>
                            {/* <div className={`flex gap-3 ${COLORS.textSec} items-center`}>
                                <button className="hover:text-white transition"><ImageIcon size={22} /></button>
                                <button className="hover:text-white transition"><AtSign size={22} /></button>
                                <button className="hover:text-white transition"><Smile size={22} /></button>
                            </div> */}
                        </div>
                    </div>
                </div>

            </AnimateEntrance >

            {/* === ACTIVITY POPUP === */}
            {
                showActivity && (
                    // Dùng style={{ top: popupTop }} để gán vị trí động
                    <div
                        className="absolute left-[calc(50%+360px)] w-[320px] animate-in fade-in zoom-in-95 duration-200 origin-top-left z-20"
                        style={{ top: `${popupTop}px` }}
                    >
                        <ActivityPopup
                            postId={postData.post_id}
                            onClose={() => setShowActivity(false)}
                        />
                    </div>
                )
            }

            {/* === ACTIVITY POPUP === */}

            {/* REPLY DIALOG */}
            {
                selectedReply && user && (
                    <ReplyCommentDialog
                        open={replyDialogOpen}
                        onOpenChange={setReplyDialogOpen}
                        currentUser={user}
                        targetPost={selectedReply}
                        mockFriends={[]} // Pass empty or fetch friends if needed
                        rootId={id || ""}
                    />
                )

            }

            {/* EDIT POST DIALOG */}
            {isEditOpen && editingPost && (
                <EditPostDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    post={editingPost}
                />
            )}
            {/* Login Prompt Overlay */}
            {showLoginPrompt && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 cursor-default"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowLoginPrompt(false);
                    }}
                >
                    <div
                        className="relative w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <LoginPrompt />
                    </div>
                </div>
            )}
        </div >
    );
};

export default PostDetail;