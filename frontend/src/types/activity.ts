
export interface ActivityItem {
    id: string;
    type: 'like' | 'reply' | 'follow' | 'mention' | 'repost';
    user: {
        username: string;
        avatar_url: string;
        is_verified?: boolean;
    };
    post_id?: string; // Optional, for context
    content?: string; // Snippet or reply content 
    created_at: string;
    is_read: boolean;
    context_text?: string; // e.g. "Suggested thread", "Mentioned you"
}

export const MOCK_ACTIVITIES: ActivityItem[] = [
    {
        id: '1',
        type: 'like',
        user: {
            username: 'theanh_vu205',
            avatar_url: 'https://i.pravatar.cc/150?u=theanh_vu205',
            is_verified: false
        },
        content: 'Khong',
        created_at: '1d',
        is_read: false
    },
    {
        id: '2',
        type: 'reply',
        user: {
            username: 'thaoautumn_',
            avatar_url: 'https://i.pravatar.cc/150?u=thaoautumn_',
        },
        context_text: 'Suggested thread',
        content: 'Rất iu',
        created_at: '2d',
        is_read: true
    },
    {
        id: '3',
        type: 'reply',
        user: {
            username: 'jeinu.06',
            avatar_url: 'https://i.pravatar.cc/150?u=jeinu.06',
        },
        context_text: 'Suggested thread',
        content: 'Ủa???',
        created_at: '1w',
        is_read: true
    },
    {
        id: '4',
        type: 'mention',
        user: {
            username: 'hn.manh207',
            avatar_url: 'https://i.pravatar.cc/150?u=hn.manh207'
        },
        context_text: 'Suggested thread',
        content: 'ê ý là hqua còn nhắn ngọt sớt đòi quen này kia sao nay nhắn chúc rồi tui chúc lại cái ghost là sao còn unfl ig tui nữa, hay là tại ổng bị ẩn tin nhắn ta, hồi đợt bên tui cũng bị nữa, giờ tui có nên nhắn hỏi không mấy bàaaaaaa, cứu tuiiii',
        created_at: '1w',
        is_read: true
    },
    {
        id: '5',
        type: 'reply',
        user: {
            username: 'nqxinhiu.06',
            avatar_url: 'https://i.pravatar.cc/150?u=nqxinhiu.06'
        },
        context_text: 'Suggested thread',
        content: 'thôi được rồi :)',
        created_at: '1w',
        is_read: true
    },
    {
        id: '6',
        type: 'reply',
        user: {
            username: 'trung26019',
            avatar_url: 'https://i.pravatar.cc/150?u=trung26019'
        },
        context_text: 'Suggested thread',
        content: 'Mé, m đùa t à=)))',
        created_at: '2w',
        is_read: true
    },
    {
        id: '7',
        type: 'follow',
        user: {
            username: 'nguyen.phan.ngan.quynh',
            avatar_url: 'https://i.pravatar.cc/150?u=nguyen.phan.ngan.quynh'
        },
        context_text: 'Posted their first thread',
        created_at: '3w',
        is_read: true
    }
];
