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


// src/data/mockData.ts

export type User = {
  id: string | number;
  username: string;
  name: string ;
  avatarUrl?: string;
  bio?: string;
  followers?: string; // Dạng string để hiển thị "3.5M" hoặc số
  link?: string;
};

// Người dùng hiện tại (Lâm Khánh)
export const CURRENT_USER: User = {
  id: "u1",
  username: "LocTran0411",
  name: "LocJanme",
  avatarUrl: "https://github.com/shadcn.png", // Demo avatar
  followers: "124K",
  bio: "Just a developer exploring the world of code!",
};

// Danh sách bạn bè để test tính năng Tag (@)
export const MOCK_FRIENDS: User[] = [
  {
    id: "u2",
    username: "soichicity",
    name: "Soi Chi City",
    avatarUrl: "https://ui-avatars.com/api/?name=Soi+Chi&background=random",
  },
  {
    id: "u3",
    username: "zuck",
    name: "Mark Zuckerberg",
    avatarUrl: "https://ui-avatars.com/api/?name=Mark+Zuckerberg&background=0078d4&color=fff",
  },
  {
    id: "u4",
    username: "elonmusk",
    name: "Elon Musk",
    avatarUrl: "https://ui-avatars.com/api/?name=Elon+Musk&background=black&color=fff",
  },
];