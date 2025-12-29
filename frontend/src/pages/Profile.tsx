import { useState } from "react";
import { useParams } from "react-router-dom";
import EditProfile from "@/components/EditProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile, useFollowUser, useUnfollowUser } from "@/hooks/api/use-users";
import { useAuth } from "@/contexts/AuthProvider";
import FeedCard from "@/components/FeedCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import CreatePostDialog from "@/components/CreatePostDialog";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";


export default function Profile() {
  const { username: paramUsername } = useParams<{ username: string }>();

  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);


  // Retrieve current user from Auth Context
  const { user: me } = useAuth();

  const username = paramUsername || me?.username || "";

  // Fetch Profile Data
  const { data: profileData, isLoading, error } = useProfile(username);

  // Mutations
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  if (!username) return <div className="text-white p-4">User not specified</div>;
  if (isLoading) return <LoadingSpinner />;

  if (error || !profileData) return <div className="text-white p-4">User not found</div>;

  const { user, posts } = profileData;
  const isOwnProfile = user.is_self;
  const isFollowing = user.is_following;
  console.log(user)
  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate(user.uid); // user.uid from response
    } else {
      followMutation.mutate(user.uid);
    }
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
            <span className="hover:underline cursor-pointer">
              <span className="text-white mr-1">{user.followers_count || 0}</span>
              followers
            </span>
            <span className="hover:underline cursor-pointer">
              <span className="text-white mr-1">{user.followings_count || 0}</span>
              following
            </span>
            {user.link && (
              <a href={user.link} target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-300 truncate">
                {user.link.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
        <Avatar className="w-[84px] h-[84px] rounded-full border border-neutral-800 shrink-0">
          <AvatarImage src={user.avatar_url || DEFAULT_AVATAR_URL} className="object-cover" />
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
      {isOwnProfile && (
        <div className="px-4 sm:px-0 py-6 flex gap-3 items-center border-b border-neutral-800 cursor-pointer" onClick={() => setIsCreatePostOpen(true)}>
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
        {posts && posts.length > 0 ? (
          posts
            .filter(post => {
              if (activeTab === "Posts") return !post.is_reposted && !post.reply_to_id;
              if (activeTab === "Reposts") return post.is_reposted;
              if (activeTab === "Replies") return !!post.reply_to_id;
              if (activeTab === "Media") return post.media_urls && post.media_urls.length > 0;
              return true;
            })
            .map((post) => (
              <FeedCard
                key={post.post_id}
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
              />
            ))
        ) : (
          <div className="py-8 text-center text-neutral-500">
            No posts yet.
          </div>
        )}
      </div>

      {/* EDIT PROFILE DIALOG */}
      {me && (
        <EditProfile
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={{
            uid: me.uid,
            id: me.uid, // Pass string ID directly
            name: me.full_name || me.username || "",
            username: me.username || "",
            bio: me.bio || "",
            link: "",
            avatar_url: me.avatar_url || DEFAULT_AVATAR_URL, // Map to avatar_url
            // followers/following not needed for EditProfile

          }}
        />
      )}
      {/* CREATE POST DIALOG */}
      {me && (
        <CreatePostDialog
          open={isCreatePostOpen}
          onOpenChange={setIsCreatePostOpen}
          currentUser={
            {
              uid: me.uid,
              username: me.username,
              full_name: me.full_name,
              avatar_url: me.avatar_url
            }
          }
          mockFriends={[]} // Pass necessary props or handle inside
        />
      )}
    </div>
  );
}
