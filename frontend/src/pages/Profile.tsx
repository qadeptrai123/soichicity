import { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import EditProfile from "@/components/EditProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile, useFollowUser, useUnfollowUser, useUserPosts, useUserReposts } from "@/hooks/api/use-users";
import { useAuth } from "@/contexts/AuthProvider";
import ReplyCommentDialog from "@/components/comment";
import type { TargetPost } from "@/types/post";
import FeedCard from "@/components/FeedCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import CreatePostDialog from "@/components/CreatePostDialog";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { LoginPrompt } from "@/components/LoginPrompt";
import { UserListDialog } from "@/components/UserListDialog";
import { UnfollowDialog } from "@/components/UnfollowDialog";

export default function Profile() {
  const { username: paramUsername } = useParams<{ username: string }>();

  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [createPostContent, setCreatePostContent] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  
  // User List Dialog State
  const [userListDialog, setUserListDialog] = useState<{
      isOpen: boolean;
      type: "followers" | "following";
  }>({ isOpen: false, type: "followers" });

  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [targetPost, setTargetPost] = useState<TargetPost | null>(null);


  // Retrieve current user from Auth Context
  const { user: me } = useAuth();

  /* Ensure we handle both "username" and "@username" from URL params */
  const normalizedParamUsername = paramUsername?.startsWith("@")
    ? paramUsername.substring(1)
    : paramUsername;

  const username = normalizedParamUsername || me?.username || "";

  // Fetch Profile Data
  const { data: profileData, isLoading, error } = useProfile(username);

  // Mutations
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  // Fetch Posts Separately - Use activeTab to drive the query
  // We use optional chaining because profileData might be undefined initially
  const targetUid = profileData?.user?.uid ?? "";
  
  const isRepostsTab = activeTab === "Reposts";
  const postType = activeTab === "Posts" ? "posts" : activeTab === "Replies" ? "replies" : activeTab === "Media" ? "media" : "posts";

  // OPTIMIZATION: Use embedded posts from Profile response as initial data to avoid 2nd fetch
  const initialPostsData = (postType === "posts" && profileData?.posts) 
    ? {
        pages: [{
            items: profileData.posts,
            next_cursor: profileData.posts_cursor ?? null,
        }],
        pageParams: [null]
    } 
    : undefined;

  const postsQuery = useUserPosts(targetUid, postType, { 
    enabled: !isRepostsTab && !!targetUid,
    initialData: initialPostsData
  });
  const repostsQuery = useUserReposts(targetUid, { enabled: isRepostsTab && !!targetUid });

  const currentQuery = isRepostsTab ? repostsQuery : postsQuery;
  
  const { 
    data: postsData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isPostsLoading
  } = currentQuery;

  // Flatten posts from infinite query pages
  const posts = postsData?.pages.flatMap((page: any) => page.items) || [];

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
      // Logic disabled if loading, but hook must run
      if (isPostsLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
              fetchNextPage();
          }
      });

      if (node) observerRef.current.observe(node);
  }, [isPostsLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (!username) return <div className="text-white p-4">User not specified</div>;
  if (isLoading) return <LoadingSpinner />;

  if (error || !profileData) return <div className="text-white p-4">User not found</div>;

  const { user } = profileData;

  const isOwnProfile = !!me && (user.is_self || user.uid === me.uid || user.username === me.username);
  const isFollowing = !!me && user.is_following;

  const handleFollowToggle = () => {
    if (!me) {
      setShowLoginPrompt(true);
      return;
    }
    if (isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      followMutation.mutate(user.uid);
    }
  };

  const handleConfirmUnfollow = () => {
      unfollowMutation.mutate(user.uid, {
          onSettled: () => setShowUnfollowDialog(false)
      });
  };

  const handleMention = () => {
      if (!me) {
          setShowLoginPrompt(true);
          return;
      }
      setCreatePostContent(`@${user.username} `);
      setIsCreatePostOpen(true);
  };

  const handleReply = (post: any, author: any) => {
    if (!me) {
      setShowLoginPrompt(true);
      return;
    }
    setTargetPost({
        id: post.post_id,
        user: {
            uid: author.uid,
            username: author.username,
            full_name: author.name,
            avatar_url: author.avatar_url
        },
        content: post.content,
        date: post.created_at,
        media_url: post.media_url,
        media_type: post.media_type,
        gallery: post.gallery,
        level: post.level
    });
    setIsReplyDialogOpen(true);
  };

  return (
    <div className="w-full max-w-[650px] mx-auto h-auto mt-4 p-4 pt-1 bg-secondary text-foreground font-sans rounded-2xl border border-neutral-800">
      {/* HEADER INFO */}
      <div className="flex justify-between items-start pt-8 pb-4 px-4 sm:px-0">
        <div className="flex flex-col gap-1 pr-4">
          <h1 className="text-[24px] font-bold leading-none tracking-tight text-white mb-1">
            {user.full_name || user.username}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[15px] text-neutral-400">@{user.username}</span>
          </div>
          {user.bio && (
            <div className="mt-3 text-[15px] text-white whitespace-pre-wrap leading-relaxed">
              {user.bio}
            </div>
          )}
          <div className="mt-4 text-[15px] text-neutral-500 flex items-center gap-4">
            <div 
                className="hover:underline cursor-pointer"
                onClick={() => setUserListDialog({ isOpen: true, type: "followers" })}
            >
              <span className="text-white mr-1">{user.followers_count || 0}</span>
              followers
            </div>
            <div 
                className="hover:underline cursor-pointer"
                onClick={() => setUserListDialog({ isOpen: true, type: "following" })}
            >
              <span className="text-white mr-1">{user.followings_count || 0}</span>
              following
            </div>
            {user.link && (
              <a href={user.link} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-300 truncate max-w-[300px]">
                {user.link.replace(/^https?:\/\//, '').length > 30 
                  ? `${user.link.replace(/^https?:\/\//, '').substring(0, 30)}...` 
                  : user.link.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
        <Avatar className="w-[84px] h-[84px] rounded-full border border-neutral-800 shrink-0">
          <AvatarImage src={user.avatar_url || DEFAULT_AVATAR_URL} className="object-cover" loading="eager" />
          <AvatarFallback className="text-3xl bg-neutral-800 text-white">
            {user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* ACTION BUTTONS */}
      <div className="px-4 sm:px-0 mb-2">
        {isOwnProfile ? (
          <Button
            onClick={() => setIsEditProfileOpen(true)}
            variant="outline"
            className="w-full bg-transparent border-neutral-700 text-white hover:bg-neutral-800 hover:text-white rounded-xl h-[44px] font-semibold text-[15px] transition-colors"
          >
            Edit profile
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleFollowToggle}
              disabled={followMutation.isPending || unfollowMutation.isPending}
              className={`flex-1 rounded-xl h-[36px] font-semibold text-[15px] transition-colors ${isFollowing
                ? "bg-transparent border border-neutral-700 text-white hover:border-red-500 hover:text-red-500 hover:bg-transparent"
                : "bg-[#3b82f6] text-white hover:bg-blue-600 border-none"
                }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button
              onClick={handleMention}
              className="flex-1 bg-transparent border border-neutral-700 text-white hover:bg-neutral-800 rounded-xl h-[36px] font-semibold text-[15px] transition-colors"
            >
              Mention
            </Button>
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex w-full border-b border-neutral-800 mb-0">
        {["Posts", "Replies", "Media", "Reposts"].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-3 text-[15px] font-medium cursor-pointer transition-colors relative ${activeTab === tab
              ? "text-white"
              : "text-neutral-500 hover:text-neutral-300"
              }`}
          >
            {tab}
            <div className={`absolute bottom-0 left-0 w-full h-[1px] ${activeTab === tab ? "bg-white" : "bg-transparent"
              }`}></div>
          </div>
        ))}
      </div>

      {/* WHAT'S NEW INPUT (Only for own profile) */}
      {isOwnProfile && activeTab === "Posts" && (
        <div className="px-4 sm:px-0 py-6 flex gap-3 items-center border-b border-neutral-800 cursor-pointer" onClick={() => {
          setCreatePostContent(""); // Clear any previous mention
          setIsCreatePostOpen(true);
        }}>
          <Avatar className="w-9 h-9 border border-neutral-800">
            <AvatarImage src={user.avatar_url || DEFAULT_AVATAR_URL} />
            <AvatarFallback>{user.username?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-neutral-500 text-[15px]">What's new?</div>
          <Button className="bg-[#3b82f6] hover:bg-blue-600 text-white rounded-full px-5 h-[34px] font-semibold text-[15px]">
            Post
          </Button>
        </div>
      )}

      {/* CONTENT FEED */}
      <div className="mt-4 px-4 sm:px-0">
        {isPostsLoading ? (
           <div className="flex justify-center p-8">
             <LoadingSpinner />
           </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
              <FeedCard
                key={post.post_id || post.repost_id} // Use repost_id if available to avoid duplicates if user reposts + posts? Actually API returns unique items per feed.
                post={{
                  ...post,
                  media_url: post.media_urls?.[0] || null,
                  gallery: post.media_urls || undefined
                }}
                author={{
                  name: post.author?.full_name || post.author?.username || "Unknown",
                  handle: `@${post.author?.username}`,
                  avatar_url: post.author?.avatar_url || DEFAULT_AVATAR_URL,
                  /** @deprecated */
                  avatar: post.author?.avatar_url || DEFAULT_AVATAR_URL,
                  id: post.author?.uid, // Legacy
                  uid: post.author?.uid || post.author_id, // Use string ID
                  username: post.author?.username || "Unknown"
                }}
                onReply={handleReply}
              />
            ))
        ) : (
          <div className="py-8 text-center text-neutral-500">
            No posts yet.
          </div>
        )}
          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-4 w-full flex justify-center items-center mt-2">
            {isFetchingNextPage && <LoadingSpinner />}
          </div>
      </div>

      {/* EDIT PROFILE DIALOG */}
      {me && (
        <EditProfile
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={{
            uid: user.uid,
            id: user.uid,
            name: user.full_name || user.username || "",
            username: user.username || "",
            bio: user.bio || "",
            link: user.link || "",
            avatar_url: user.avatar_url || DEFAULT_AVATAR_URL,
          }}
        />
      )}
      {/* CREATE POST DIALOG */}
      {me && (
        <CreatePostDialog
          open={isCreatePostOpen}
          onOpenChange={(open) => {
            setIsCreatePostOpen(open);
            if (!open) setCreatePostContent("");
          }}
          currentUser={
            {
              uid: me.uid,
              username: me.username,
              full_name: me.full_name,
              avatar_url: me.avatar_url
            }
          }
          mockFriends={[]} // Pass necessary props or handle inside
          initialContent={createPostContent}
        />
      )}

       {/* Login Prompt Overlay */}
       {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <LoginPrompt />
          </div>
        </div>
      )}

      {/* USER LIST DIALOG */}
      <UserListDialog
          isOpen={userListDialog.isOpen}
          onClose={() => setUserListDialog(prev => ({ ...prev, isOpen: false }))}
          userId={user.uid}
          type={userListDialog.type}
          username={user.username}
      />

       <UnfollowDialog
          isOpen={showUnfollowDialog}
          onClose={() => setShowUnfollowDialog(false)}
          onConfirm={handleConfirmUnfollow}
          username={user.username}
          avatarUrl={user.avatar_url}
          isPending={unfollowMutation.isPending}
      />

      {/* REPLY DIALOG */}
      {targetPost && (
        <ReplyCommentDialog
          open={isReplyDialogOpen}
          onOpenChange={setIsReplyDialogOpen}
          currentUser={{
            uid: me?.uid || "",
            id: me?.uid || "",
            username: me?.username || "user",
            name: me?.full_name || "User",
            avatar_url: me?.avatar_url || DEFAULT_AVATAR_URL,
            bio: ""
          }}
          targetPost={targetPost}
          mockFriends={[]}
          rootId={targetPost.id.toString()}
        />
      )}
    </div>
  );
}
