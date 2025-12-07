import { useState } from "react";
import CreatePostDialog from "./CreatePostDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Heart,
  MessageSquare,
  Repeat,
  Send,
  Pin,
  Save,
  Bookmark,
  Edit,
  Trash2,
  Copy,
  ChevronRight,
} from "lucide-react";
import type { User } from "../MockData/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PostData = {
  id: number;
  content: string;
  mediaFiles: { url: string; type: "image" | "video" }[];
  timestamp: number;
  author: User;
  pinned?: boolean;
};

interface ProfileProps {
  currentUser: User;
  mockFriends: User[];
}

export default function Profile({ currentUser, mockFriends }: ProfileProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState("");

  const [posts, setPosts] = useState<PostData[]>([]);
  const [activeTab, setActiveTab] = useState("Threads");

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}p`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const handleCreatePost = (
    content: string,
    mediaFiles: { url: string; type: "image" | "video" }[]
  ) => {
    const newPost: PostData = {
      id: Date.now(),
      content,
      mediaFiles,
      timestamp: Date.now(),
      author: currentUser,
    };
    setPosts([newPost, ...posts]);
    setIsDialogOpen(false);
  };

  const handleTogglePin = (postId: number) => {
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId ? { ...p, pinned: !p.pinned } : p
      );
      // Đưa bài ghim lên đầu
      updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
      return updated;
    });
  };

  const handleEdit = (postId: number) => {
    alert(`Edit post ${postId}`);
  };

  const handleRemove = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="w-full max-w-[600px] mx-auto h-auto mt-4 p-4 bg-secondary text-foreground font-sans rounded-2xl border border-neutral-800">
      {/* HEADER INFO */}
      <div className="flex justify-between items-start pt-8 pb-4 px-4 sm:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold leading-none tracking-tight">
            {currentUser.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[15px]">{currentUser.username}</span>
          </div>
          <div className="mt-4 text-[15px] text-neutral-500 hover:underline cursor-pointer">
            {currentUser.followers} followers
          </div>
        </div>
        <Avatar className="w-[84px] h-[84px] border border-neutral-800">
          <AvatarImage src={currentUser.avatarUrl} className="object-cover" />
          <AvatarFallback className="text-3xl bg-neutral-800">
            {currentUser.username[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* EDIT PROFILE BUTTON */}
      <div className="px-4 sm:px-0 mb-4">
        <Button 
          onClick={() => setIsEditProfileOpen(true)} // Mở dialog khi bấm
          className="w-full bg-transparent border border-neutral-700 text-white hover:bg-neutral-900 hover:text-white rounded-xl h-[34px] font-semibold text-[15px] transition-colors"
        >
          Edit profile
        </Button>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex w-full border-b border-neutral-800 mb-2">
        {["Threads", "Replies", "Media", "Reposts"].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-3 text-[15px] font-semibold cursor-pointer transition-colors relative ${
              activeTab === tab
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white"></div>
            )}
          </div>
        ))}
      </div>

      {/* "WHAT'S NEW" */}
      {activeTab === "Threads" && (
        <div className="px-4 sm:px-0">
          <div
            className="flex items-center gap-3 py-4 cursor-pointer"
            onClick={() => setIsDialogOpen(true)}
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={currentUser.avatarUrl} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="text-neutral-500 text-[15px] flex-1">
              What's new?
            </div>
            <Button
              variant="outline"
              className="ml-auto rounded-[10px] border-neutral-700 bg-transparent text-white h-8 px-4 font-semibold text-sm hover:bg-neutral-800 hover:text-white"
            >
              Post
            </Button>
          </div>
          <div className="h-[1px] bg-[#101828] w-full mb-2"></div>
        </div>
      )}

      {/* CONTENT FEED */}
      <div className="px-4 sm:px-0">
        {posts.map((post) => (
          <div
            key={post.id}
            className= "py-4 border-b border-[#101828]  flex gap-4"
          >
            <div className="flex flex-col items-center flex-shrink-0">
              <Avatar className="w-9 h-9 border border-neutral-800">
                <AvatarImage src={post.author.avatarUrl} />
                <AvatarFallback>{post.author.username[0]}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[15px] text-white hover:underline cursor-pointer">
                    {post.author.username}
                  </span>
                  {post.pinned && <Pin size={12} className="text-neutral-500 rotate-45" />}
                  <span className="text-[13px] text-neutral-500">
                    {getTimeAgo(post.timestamp)}
                  </span>
                </div>

                {/* MORE DROPDOWN */}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreHorizontal
                      size={20}
                      className="cursor-pointer text-[#99A1AF] hover:text-white transition-colors"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-secondary border border-[#2A2F3E] rounded-lg p-2 shadow-lg flex flex-col gap-3 w-[190px] h-[210px]">
                    <DropdownMenuItem className="flex items-center justify-between p-1 hover:bg-neutral-700 rounded cursor-pointer text-white">
                    Save 
                    <Save size={16} className="text-[#71717A]" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                    className="flex items-center justify-between p-1 hover:bg-neutral-700 rounded cursor-pointer text-white"
                    onClick={() => handleTogglePin(post.id)}>
                    {post.pinned ? "Unpin" : "Pin"} 
                    <Pin size={16} className="text-[#71717A]" />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center justify-between p-1 hover:bg-neutral-700 rounded cursor-pointer text-white"
                    onClick={() => handleEdit(post.id)}>
                    Edit 
                    <Edit size={16} className="text-[#71717A]" />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center justify-between p-1 rounded cursor-pointer text-red-500 hover:bg-neutral-700 hover:text-red-500"
                    onClick={() => handleRemove(post.id)}>
                    Remove
                    <Trash2 size={16} className="text-[#71717A]" />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center justify-between p-1 hover:bg-neutral-700 rounded cursor-pointer text-white">
                    Copy Link 
                    <Copy size={16} className="text-[#71717A]" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="whitespace-pre-wrap text-[15px] text-white mt-0.5 leading-relaxed">
                {post.content.split(" ").map((word, i) =>
                  word.startsWith("@") ? (
                    <span
                      key={i}
                      className="text-[#0095f6] mr-1 hover:underline cursor-pointer">
                      {word}
                    </span>
                  ) : (
                    <span key={i} className="mr-1">
                      {word}
                    </span>
                  )
                )}
              </p>
              {post.mediaFiles.length > 0 && (
                <div
                  className={`mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${
                    post.mediaFiles.length > 1 ? "pr-4" : ""
                  }`}>
                  {post.mediaFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden max-h-[300px] border border-neutral-800 flex-shrink-0">
                      {file.type === "image" ? (
                        <img
                          src={file.url}
                          className="h-full w-auto object-cover min-w-[200px]"/>
                      ) : (
                        <video
                          src={file.url}
                          controls
                          className="h-full w-auto min-w-[200px]"/>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 mt-3 text-neutral-400 select-none">
                <div className="flex items-center gap-1 cursor-pointer">
                    <Heart size={20} />
                    <span className="text-[14px]">127</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                    <MessageSquare size={20} />
                    <span className="text-[14px]">24</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                  <Bookmark size={20} />
                  <span className="text-[14px]">69</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                    <Repeat size={20} />
                    <span className="text-[14px]">12</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                    <Send size={20} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DIALOG POPUP */}
      <CreatePostDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentUser={currentUser}
        mockFriends={mockFriends}
        onPost={handleCreatePost}/>

        {/* DIALOG POPUP EDIT PROFILE (Code mới) */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Lớp nền: Chỉ dùng bg-black/60 để làm tối, KHÔNG DÙNG backdrop-blur */}
          <div 
            className="absolute inset-0 bg-black/60" 
            onClick={() => setIsEditProfileOpen(false)}
          ></div>
          
          {/* Hộp Dialog */}
          <div className="relative z-10 w-full max-w-[400px] bg-secondary text-white border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header Dialog */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900">
              <div className="flex flex-col">
                <span className="font-bold text-lg">{editName}</span>
                <span className="text-sm text-neutral-500">{currentUser.username}</span>
              </div>
              <Avatar className="w-10 h-10 border border-neutral-800">
                <AvatarImage src={currentUser.avatarUrl} className="object-cover" />
                <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
              </Avatar>
            </div>

            <div className="p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-[15px] font-semibold text-neutral-200">Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-neutral-800 text-white focus:outline-none focus:border-neutral-600 h-12 rounded-xl px-4 text-[15px]"
                  />
                </div>
              </div>

              {/* Bio Field - Nhỏ gọn h-14 */}
              <div className="space-y-2">
                <label className="text-[15px] font-semibold text-neutral-200">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="+ Write bio"
                  className="w-full bg-[#1e1e1e] border border-neutral-800 text-white placeholder:text-neutral-500 p-3 h-14 rounded-xl resize-none focus:outline-none focus:border-neutral-600 text-[15px]"
                />
              </div>

              {/* List Settings */}
              <div className="flex flex-col gap-1">
                <label className="text-[15px] font-semibold text-neutral-200 mb-1">Interests</label>
                <div className="flex items-center justify-between py-2 cursor-pointer hover:opacity-70">
                  <span className="text-neutral-500 text-sm">Add interests</span>
                  <ChevronRight size={20} className="text-neutral-600" />
                </div>
                <div className="h-[1px] bg-neutral-900 w-full my-1"></div>

                {/* Link - Compact 1 dòng */}
                <div className="flex items-center justify-between py-3 mt-1 cursor-pointer hover:opacity-70">
                  <span className="text-[15px] font-semibold text-neutral-200">Link</span>
                  <ChevronRight size={20} className="text-neutral-600" />
                </div>
                <div className="h-[1px] bg-neutral-900 w-full my-1"></div>
                  
                {/* Block List */}
                <div className="flex items-center justify-between py-3 mt-1 cursor-pointer hover:opacity-70">
                  <span className="text-[15px] font-semibold text-red-500">Block List</span>
                  <ChevronRight size={20} className="text-neutral-600" />
                </div>
                <div className="h-[1px] bg-neutral-900 w-full my-1"></div>

                {/* Privacy */}
                <div className="flex items-center justify-between py-3 mt-1 cursor-pointer hover:opacity-70">
                  <div className="flex flex-col">
                      <span className="text-[15px] font-semibold text-neutral-200">Profile privacy</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-neutral-500 text-sm">Private</span>
                      <ChevronRight size={20} className="text-neutral-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Button */}
            <div className="p-6 pt-0">
                <Button 
                    className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold h-12 rounded-xl text-[16px]"
                    onClick={() => setIsEditProfileOpen(false)}
                >
                    Done
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

