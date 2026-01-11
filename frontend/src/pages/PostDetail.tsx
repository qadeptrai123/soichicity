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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoginPrompt } from "@/components/LoginPrompt";
import EditPostDialog from "@/components/EditPostDialog";

const PostDetail = () => {
    const { id } = useParams();
    const { data: postData, isLoading } = usePostDetail(id || "");
    const [showActivity, setShowActivity] = useState(false);
    const { user, isAuthenticated } = useAuth();
    console.log(postData)
    console.log("PostDetail User Debug:", user);
    // Reply Dialog State
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [selectedReply, setSelectedReply] = useState<TargetPost | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Edit Post State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<any | null>(null);

    // Auto Scroll to Comment
    React.useEffect(() => {
        if (!isLoading && postData?.replies) {
            const params = new URLSearchParams(window.location.search);
            const commentId = params.get("commentId");
            if (commentId) {
                // Wait a bit for rendering
                setTimeout(() => {
                    const element = document.getElementById(`comment-${commentId}`);
                    if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                        element.classList.add("bg-white/5"); // Highlight effect
                        setTimeout(() => element.classList.remove("bg-white/5"), 2000);
                    }
                }, 500);
            }
        }
    }, [isLoading, postData?.replies]);

    const handleReplyClick = (reply: any) => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        // Normalize gallery to string[]
        let normalizedGallery: string[] | undefined = undefined;
        if (reply.gallery && Array.isArray(reply.gallery) && reply.gallery.length > 0) {
            if (typeof reply.gallery[0] === 'string') {
                normalizedGallery = reply.gallery;
            } else if (typeof reply.gallery[0] === 'object' && reply.gallery[0]?.url) {
                normalizedGallery = reply.gallery.map((item: any) => item.url);
            }
        } else if (reply.media_urls && Array.isArray(reply.media_urls) && reply.media_urls.length > 0) {
            normalizedGallery = reply.media_urls;
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
            media_url: normalizedGallery?.[0] || reply.media_url || null,
            gallery: normalizedGallery,
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
    if (!postData) return (
        <div className={`flex flex-col items-center justify-center min-h-[50vh] text-center p-8 ${COLORS.bgPage} text-white`}>
            <div className="bg-white/5 p-6 rounded-full mb-6">
                <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Post not found</h2>
            <p className="text-[#94a3b8] max-w-md mb-8">
                This post may have been deleted, or does not exist.
            </p>
            <button
                onClick={() => window.history.back()}
                className="bg-[#2B7FFF] hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-full transition-all"
            >
                Go Back
            </button>
        </div>
    );

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
                            onReply={() => handleReplyClick(postData)}
                            onEdit={(post) => {
                                setEditingPost(post);
                                setIsEditOpen(true);
                            }}
                            onAuthRequired={() => setShowLoginPrompt(true)}
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
                                            onEdit={(post) => {
                                                setEditingPost(post);
                                                setIsEditOpen(true);
                                            }}
                                            onAuthRequired={() => setShowLoginPrompt(true)}
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
                                <AvatarImage src={user?.avatar_url && user.avatar_url !== DEFAULT_AVATAR_URL ? user.avatar_url : (user?.avatar || DEFAULT_AVATAR_URL)} />
                                <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "ME"}</AvatarFallback>
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
            {/* Login Prompt Dialog */}
            <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-sm" showCloseButton={false}>
                    <DialogTitle className="sr-only">Login Required</DialogTitle>
                    <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default PostDetail;