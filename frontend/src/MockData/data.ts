// import type { User } from "./type";

// export const CURRENT_USER: User = {
//   id: "user_99",
//   name: "Trần Hữu Lộc",
//   username: "LocTran0411",
//   avatarUrl: "https://github.com/shadcn.png",
// };

// export const MOCK_FRIENDS: User[] = [
//   { id: "1", name: "Alice", username: "alice123" },
//   { id: "2", name: "Bob", username: "bob_builder" },
//   { id: "3", name: "Charlie", username: "charlie_brown" },
//   { id: "4", name: "David", username: "david_beckham" },
//   { id: "5", name: "Eve", username: "eve_polastri" },
//   { id: "6", name: "Frank", username: "frank_underwood" },
//   { id: "7", name: "Grace", username: "grace_hopper" },
//   { id: "8", name: "Hannah", username: "hannah_montana" },
//   { id: "9", name: "Ian", username: "ian_somerhalder" },
//   { id: "10", name: "Judy", username: "judy_garland" },
//   { id: "11", name: "Kevin", username: "kevin_bacon" },
//   { id: "12", name: "Laura", username: "laura_croft" },
//   { id: "13", name: "Mike", username: "mike_tyson" },
//   { id: "14", name: "Nina", username: "nina_simone" },
//   { id: "15", name: "Oscar", username: "oscar_wilde" },
// ];



import type { User, TargetPost } from "./type";

// Hàm format ngày tháng năm hiện tại theo định dạng DD/MM/YYYY
const getCurrentDate = (): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};

export const CURRENT_USER: User = {
  id: "user_99",
  name: "Trần Hữu Lộc",
  username: "LocTran0411",
  avatarUrl: "https://github.com/shadcn.png",
  bio: "Milk Tea Lover ☕",
  link: "https://www.facebook.com/share/1DXyXE4V4J/",
  follower_count: 42,
};

export const OTHER_USER: User = {
  id: "user_123",
  name: "Chú mèo Tâm",
  username: "tam.themeow",
  avatarUrl: "https://i.pravatar.cc/300?img=3",
  bio: "Tâm rất mèo 🐱",
  link: "tiktok.com/@tam.themeow",
  follower_count: 570,
  following_count: 123,
};

export const MOCK_FRIENDS: User[] = [
  { id: "1", name: "Alice", username: "alice123" },
  { id: "2", name: "Bob", username: "bob_builder" },
  { id: "3", name: "Charlie", username: "charlie_brown" },
  { id: "4", name: "David", username: "david_beckham" },
  { id: "5", name: "Eve", username: "eve_polastri" },
  { id: "6", name: "Frank", username: "frank_underwood" },
  { id: "7", name: "Grace", username: "grace_hopper" },
  { id: "8", name: "Hannah", username: "hannah_montana" },
  { id: "9", name: "Ian", username: "ian_somerhalder" },
  { id: "10", name: "Judy", username: "judy_garland" },
  { id: "11", name: "Kevin", username: "kevin_bacon" },
  { id: "12", name: "Laura", username: "laura_croft" },
  { id: "13", name: "Mike", username: "mike_tyson" },
  { id: "14", name: "Nina", username: "nina_simone" },
  { id: "15", name: "Oscar", username: "oscar_wilde" },
];

export const MOCK_TARGET_POST: TargetPost = {
  id: 1,
  user: {
    id: "target_user_1",
    username: "loc.tran0411",
    name: "TranHuuLoc",
    avatarUrl: "https://i.pravatar.cc/150?u=cat",
  },
  content: 'Ôi, Sợ nhóm trưởng quá. Huhu !!!"',
  date: getCurrentDate(),
};

export const MOCK_BLOCKED_USERS: User[] = [
  { id: "blocked_1", name: "User Block", username: "blocked.user1" },
  { id: "blocked_2", name: "Spam Account", username: "spam.account" },
  { id: "blocked_3", name: "Annoying User", username: "annoying.user" },
  { id: "blocked_4", name: "Toxic Person", username: "toxic.person" },
  { id: "blocked_5", name: "Blocked", username: "blocked.five" },
];
