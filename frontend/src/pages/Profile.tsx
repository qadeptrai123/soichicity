import { useState } from "react";
import { useParams } from "react-router-dom";
import EditProfile from "@/components/EditProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile, useFollowUser, useUnfollowUser, useMe } from "@/hooks/api/use-users";
import FeedCard from "@/components/FeedCard";

export default function Profile() {
  const { username: paramUsername } = useParams<{ username: string }>();

  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Fetch current user (me) to verify identity if needed, though profile response has is_self
  const { data: me } = useMe();

  const username = paramUsername || me?.username || "";

  // Fetch Profile Data
  const { data: profileData, isLoading, error } = useProfile(username);

  // Mutations
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  if (!username) return <div className="text-white p-4">User not specified</div>;
  if (isLoading) return <div className="text-white p-4">Loading profile...</div>;
  if (error || !profileData) return <div className="text-white p-4">User not found</div>;

  const { user, posts } = profileData;
  const isOwnProfile = user.is_self;
  const isFollowing = user.is_following;

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate(user.uid); // user.uid from response
    } else {
      followMutation.mutate(user.uid);
    }
  };

  return (
    <div className="w-full max-w-[650px] mx-auto h-auto mt-4 p-4 bg-secondary text-foreground font-sans rounded-2xl border border-neutral-800">
      {/* HEADER INFO */}
      <div className="flex justify-between items-start pt-8 pb-4 px-4 sm:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold leading-none tracking-tight text-white">
            {user.full_name || user.username}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[15px] text-neutral-500">@{user.username}</span>
          </div>
          {user.bio && (
            <div className="mt-2 text-[15px] text-white">
              {user.bio}
            </div>
          )}
          <div className="mt-2 text-[15px] text-neutral-500 flex items-center gap-4">
            <span className="hover:underline cursor-pointer">
              <span className="font-bold text-white mr-1">{user.followers_count || 0}</span>
              followers
            </span>
            <span className="hover:underline cursor-pointer">
              <span className="font-bold text-white mr-1">{user.followings_count || 0}</span>
              following
            </span>
          </div>
        </div>
        <Avatar className="w-[84px] h-[84px] border border-neutral-800">
          <AvatarImage src={user.avatar_url || ""} className="object-cover" />
          <AvatarFallback className="text-3xl bg-neutral-800 text-white">
            {user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* ACTION BUTTONS */}
      <div className="px-4 sm:px-0 mb-4">
        {isOwnProfile ? (
          <Button
            onClick={() => setIsEditProfileOpen(true)}
            className="w-full bg-transparent border border-neutral-700 text-white hover:bg-neutral-800 rounded-xl h-[34px] font-medium text-[15px] transition-colors"
          >
            Edit profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleFollowToggle}
              disabled={followMutation.isPending || unfollowMutation.isPending}
              className={`flex-1 rounded-xl h-[34px] font-medium text-[15px] transition-colors ${isFollowing
                ? "bg-transparent border border-zinc-600 text-white hover:border-red-500 hover:text-red-500"
                : "bg-white text-black hover:bg-neutral-200"
                }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button
              className="flex-1 bg-transparent border border-neutral-700 text-white hover:bg-neutral-800 rounded-xl h-[34px] font-medium text-[15px] transition-colors"
            >
              Mention
            </Button>
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex w-full border-b border-neutral-800 mb-2">
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
            <div className={`absolute bottom-0 left-0 w-full h-[3px] rounded-t-sm ${activeTab === tab ? "bg-[#3b82f6]" : "bg-transparent"
              }`}></div>
          </div>
        ))}
      </div>

      {/* CONTENT FEED */}
      <div className="px-4 sm:px-0">
        {posts && posts.length > 0 ? (
          posts
            .filter(post => {
              if (activeTab === "Posts") return !post.is_repost && !post.reply_to_id;
              if (activeTab === "Reposts") return post.is_repost;
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
                  gallery: post.media_urls?.map(url => ({ url, type: "image" }))
                }}
                author={{
                  name: post.author?.full_name || post.author?.username || "Unknown",
                  handle: `@${post.author?.username}`,
                  avatar: post.author?.avatar_url || "",
                  id: post.author?.uid, // Use string ID
                  username: post.author?.username
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
            id: me.uid, // Pass string ID directly
            name: me.full_name || me.username || "",
            username: me.username || "",
            bio: me.bio || "",
            link: "",
            avatarUrl: me.avatar_url || "", // Map to avatarUrl
            followers: [],
            following: []
          }}
        />
      )}
    </div>
  );
}
