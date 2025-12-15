import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import EditProfile from "@/components/EditProfile";
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
} from "lucide-react";
import { CURRENT_USER, MOCK_FRIENDS, OTHER_USER } from "@/MockData/data";
import type { User } from "@/MockData/type";
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

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  
  // Determine which user profile to show
  const profileUser = id && id !== String(CURRENT_USER.id) ? OTHER_USER : CURRENT_USER;
  const [currentUser] = useState<User>(CURRENT_USER);
  const [displayUser] = useState<User>(profileUser);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [activeTab, setActiveTab] = useState("Threads");
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Check if viewing own profile
  const isOwnProfile = !id || id === String(currentUser.id);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

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
    <div className="w-full max-w-[650px] mx-auto h-auto mt-4 p-4 bg-secondary text-foreground font-sans rounded-2xl border border-neutral-800">
      {/* HEADER INFO */}
      <div className="flex justify-between items-start pt-8 pb-4 px-4 sm:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold leading-none tracking-tight">
            {displayUser.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[15px] text-neutral-500">{displayUser.username}</span>
          </div>
          {displayUser.bio && (
            <div className="mt-2 text-[15px] text-white">
              {displayUser.bio}
            </div>
          )}
          <div className="mt-2 text-[15px] text-neutral-500 flex items-center gap-4">
            <span className="hover:underline cursor-pointer">
              {displayUser.follower_count || displayUser.followers?.length || 0} followers
            </span>
            {displayUser.link && (
              <>
                <a 
                  href={`https://${displayUser.link}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer"
                >
                  {displayUser.link}
                </a>
              </>
            )}
          </div>
        </div>
        <Avatar className="w-[84px] h-[84px] border border-neutral-800">
          <AvatarImage src={displayUser.avatarUrl} className="object-cover" />
          <AvatarFallback className="text-3xl bg-neutral-800">
            {displayUser.username[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* ACTION BUTTONS */}
      <div className="px-4 sm:px-0 mb-4">
        {isOwnProfile ? (
          <Button 
            onClick={() => setIsEditProfileOpen(true)} 
            className="w-full bg-transparent border border-neutral-700 text-white hover:bg-[#3b82f6] hover:text-white rounded-xl h-[34px] font-medium text-[15px] transition-colors"
          >
            Edit profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleFollowToggle}
              className={`flex-1 rounded-xl h-[34px] font-medium text-[15px] transition-colors ${
                isFollowing 
                  ? "bg-transparent border border-accent text-white hover:bg-red-600 hover:text-white" 
                  : "bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
            <Button 
              className="flex-1 bg-transparent border border-accent text-white hover:bg-[#3b82f6] hover:text-white rounded-xl h-[34px] font-medium text-[15px] transition-colors"
            >
              Mention
            </Button>
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex w-full border-b border-border-hover mb-2">
        {["Threads", "Replies", "Media", "Reposts"].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-3 text-[15px] font-medium cursor-pointer transition-colors relative ${
              activeTab === tab
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab}
            <div className={`absolute bottom-0 left-0 w-full h-[0.15px] ${
              activeTab === tab ? "bg-white" : "bg-border-hover"
            }`}></div>
          </div>
        ))}
      </div>

      {/* POST INPUT SECTION - Only for own profile */}
      {isOwnProfile && (
        <div className="px-4 sm:px-0 py-4 border-b border-border-hover mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-neutral-800 flex-shrink-0">
              <AvatarImage src={currentUser.avatarUrl} className="object-cover" />
              <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
            </Avatar>
            <input
              type="text"
              placeholder="What's new?"
              className="flex-1 bg-transparent text-[15px] text-neutral-500 focus:outline-none placeholder:text-neutral-500"
            />
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium h-9 px-6 rounded-xl text-[15px]">
              Post
            </Button>
          </div>
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
                  <span className="font-medium text-[15px] text-white hover:underline cursor-pointer">
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

      {/* EDIT PROFILE DIALOG */}
      <EditProfile 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

