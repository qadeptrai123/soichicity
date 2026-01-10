import type { User } from './user';
import type { Post } from './post';

export interface ProfileResponse {
    user: User;
    posts: Post[];
    posts_cursor?: string | null;
    posts_count: number;
}
