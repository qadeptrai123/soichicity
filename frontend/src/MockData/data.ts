import type { User } from "@/types/auth";

export type TargetPost = {
  id: string | number;
  user: {
    uid: string;
    username: string;
    full_name: string | null;
    avatar_url?: string;
  };
  content: string;
  date: string;
};

// Hàm format ngày tháng năm hiện tại theo định dạng DD/MM/YYYY
const getCurrentDate = (): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};

export const CURRENT_USER: User = {
  uid: "user_99",
  full_name: "Trần Hữu Lộc",
  username: "LocTran0411",
  email: "loctran@example.com",
  avatar_url: "https://github.com/shadcn.png",
  is_active: true,
  provider: "password",
  created_at: new Date().toISOString(),
  followers_count: 0,
  followings_count: 0,
  blocks_count: 0,
  reposts_count: 0,
  saves_count: 0,
  likes_count: 0,
  notifications_count: 0,
};

export const MOCK_FRIENDS: User[] = [
  { uid: "1", full_name: "Alice", username: "alice123", email: "alice@ex.com", is_active: true, provider: "password", created_at: "", followers_count: 0, followings_count: 0, blocks_count: 0, reposts_count: 0, saves_count: 0, likes_count: 0, notifications_count: 0 },
  { uid: "2", full_name: "Bob", username: "bob_builder", email: "bob@ex.com", is_active: true, provider: "password", created_at: "", followers_count: 0, followings_count: 0, blocks_count: 0, reposts_count: 0, saves_count: 0, likes_count: 0, notifications_count: 0 },
  { uid: "3", full_name: "Charlie", username: "charlie_brown", email: "charlie@ex.com", is_active: true, provider: "password", created_at: "", followers_count: 0, followings_count: 0, blocks_count: 0, reposts_count: 0, saves_count: 0, likes_count: 0, notifications_count: 0 },
  { uid: "4", full_name: "David", username: "david_beckham", email: "david@ex.com", is_active: true, provider: "password", created_at: "", followers_count: 0, followings_count: 0, blocks_count: 0, reposts_count: 0, saves_count: 0, likes_count: 0, notifications_count: 0 },
  { uid: "5", full_name: "Eve", username: "eve_polastri", email: "eve@ex.com", is_active: true, provider: "password", created_at: "", followers_count: 0, followings_count: 0, blocks_count: 0, reposts_count: 0, saves_count: 0, likes_count: 0, notifications_count: 0 },
];

export const MOCK_TARGET_POST: TargetPost = {
  id: 1,
  user: {
    uid: "target_user_1",
    username: "loc.tran0411",
    full_name: "TranHuuLoc",
    avatar_url: "https://i.pravatar.cc/150?u=cat",
  },
  content: 'Ôi, Sợ nhóm trưởng quá. Huhu !!!"',
  date: getCurrentDate(),
};
