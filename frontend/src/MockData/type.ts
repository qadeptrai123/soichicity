export interface User {
  id: string | number;
  name: string | null;
  username: string;
  avatar_url?: string;
  avatarUrl?: string;
  bio?: string;
  link?: string;
  followers?: string[];
  following?: string[];
  follower_count?: number;
  following_count?: number;
}

export interface TargetPost {
  id: string | number;
  user: User;
  content: string;
  date: string;
}