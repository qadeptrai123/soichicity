export interface User {
  id: string | number;
  name: string | null;
  username: string;
  avatarUrl?: string;
  
}

export interface TargetPost {
  id: string | number;
  user: User;
  content: string;
  date: string;
}

