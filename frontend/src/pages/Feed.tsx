// Trang này sẽ là trang home luôn
import FeedCard from '@/components/FeedCard';
import type { PostData, AuthorData, MediaItem } from '@/components/FeedCard';

// --- BẮT ĐẦU: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

// Danh sách tác giả giả
const mockAuthors = [
    { name: 'John Doe', handle: '@johndoe', avatarSeed: 'John' },
    { name: 'Jane Smith', handle: '@janesmith', avatarSeed: 'Jane' },
    { name: 'Alex Johnson', handle: '@alexj', avatarSeed: 'Alex' },
    { name: 'Sarah Connor', handle: '@sarahc', avatarSeed: 'Sarah' },
    { name: 'Michael Scott', handle: '@mscott', avatarSeed: 'Michael' },
    { name: 'Dwight Schrute', handle: '@dwights', avatarSeed: 'Dwight' },
    { name: 'Pam Beesly', handle: '@pamb', avatarSeed: 'Pam' },
    { name: 'Jim Halpert', handle: '@jimh', avatarSeed: 'Jim' },
    { name: 'Leslie Knope', handle: '@lesliek', avatarSeed: 'Leslie' },
    { name: 'Ron Swanson', handle: '@rons', avatarSeed: 'Ron' },
];

// URLs video YouTube 
const youtubePlaceholders = [
    'https://www.youtube.com/watch?v=Oz8RF_1eGxw',
    'https://www.youtube.com/watch?v=eMW9ZxXxCHI',
    'https://www.youtube.com/watch?v=8STFDAO7UEQ',
    'https://www.youtube.com/watch?v=mnBAZ-VkuEg',
    'https://www.youtube.com/watch?v=3bJkVSMs4dw',
];

// URLs ảnh placeholder (giữ nguyên)
const imagePlaceholders = [
    'https://th.bing.com/th/id/OIP.epQ3-fDwbFjCeT9FJ0zySAHaE4?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://th.bing.com/th/id/OIP.CFG1RgZ9gTRtNgk_wWxG8QHaEO?w=283&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.dnjO4CzIXomeStDIwIThywHaEC?w=331&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3',
    'https://th.bing.com/th/id/OIP.JNrN7rlOnylypuewePK6WQHaE1?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://th.bing.com/th?id=OIF.uDz7%2fCrozQsK48iGq6eNjg&w=276&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&crop=faces',
];

// Nội dung bài đăng giả (giữ nguyên)
const textContent = [
    'Just finished an amazing project! Feeling super accomplished. What are you all working on?',
    'Loving the new features in the latest update. It really streamlines the workflow!',
    'A little behind-the-scenes look at my workspace today. Productivity is key! 💻',
    'Thoughts on the latest tech trends? Are we ready for the next big thing?',
    'Travel goals: Where should I go next? Drop your best recommendations below! 🌍',
    'Sometimes you just need a good cup of coffee to get through the day. ☕',
    'Experimenting with new recipes this weekend. Wish me luck! 🍲',
    'Found this incredible quote today: "The only way to do great work is to love what you do." - Steve Jobs',
    'Nature walk was exactly what I needed to clear my head. Highly recommend taking a break!',
    'Excited to announce my new product launch next week! Stay tuned for more details.',
    'Just watched a great documentary. Mind blown! 🤯',
    'Coding late tonight. The debugger is my best friend (and worst enemy).',
    'Throwback to a great vacation. Missing the sun and the beach! 🏖️',
    'Learning a new programming language. Any tips for a beginner?',
    'Happy Friday, everyone! What are your weekend plans?',
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMedia(id: number): { media_url: string | null; media_type?: 'image' | 'video'; gallery?: MediaItem[] } {
    const mediaTypeRoll = id % 6;
    if (mediaTypeRoll === 0) {
        return { media_url: null };
    } else if (mediaTypeRoll === 1) {
        return { media_url: getRandomItem(imagePlaceholders), media_type: 'image' };
    } else if (mediaTypeRoll === 2 || mediaTypeRoll === 4) {
        return { media_url: getRandomItem(youtubePlaceholders), media_type: 'video' };
    } else {
        // Gallery with multiple images
        const galleryCount = 2 + Math.floor(Math.random() * 3); // 2-4 images
        const gallery: MediaItem[] = [];
        for (let i = 0; i < galleryCount; i++) {
            gallery.push({
                url: getRandomItem(imagePlaceholders),
                type: 'image'
            });
        }
        return { media_url: null, gallery };
    }
}

function getRandomDate(index: number): string {
    const now = Date.now();
    const hoursAgo = index * 2 + Math.floor(Math.random() * 4);
    return new Date(now - hoursAgo * 3600000).toISOString();
}

function getRandomCounts() {
    return {
        actions_count: Math.floor(Math.random() * 500),
        replies_count: Math.floor(Math.random() * 100),
        bookmark_count: Math.floor(Math.random() * 200),
        shares_count: Math.floor(Math.random() * 50)
    };
}

const mockPosts: (PostData & { author: AuthorData })[] = [];
const totalPosts = 32;

for (let i = 1; i <= totalPosts; i++) {
    const randomAuthor = getRandomItem(mockAuthors);
    const media = getRandomMedia(i);
    const counts = getRandomCounts();
    const authorId = `user${i}`;

    let content = getRandomItem(textContent);
    let authorData = {
        name: randomAuthor.name,
        handle: randomAuthor.handle,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomAuthor.avatarSeed}`
    };

    // Special cases with galleries
    if (i === 1) {
        content = 'This is my first post! Testing the FeedCard component with custom theme.';
        media.media_url = null;
        media.media_type = undefined;
        media.gallery = undefined;
        authorData = { name: 'John Doe', handle: '@johndoe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' };
    } else if (i === 2) {
        content = 'Check out this amazing image I found!';
        media.media_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500';
        media.media_type = 'image';
        media.gallery = undefined;
        authorData = { name: 'Jane Smith', handle: '@janesmith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' };
    } else if (i === 3) {
        content = 'Gallery test: 4 photos from my weekend adventure! 📸';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[0], type: 'image' },
            { url: imagePlaceholders[1], type: 'image' },
            { url: imagePlaceholders[2], type: 'image' },
            { url: imagePlaceholders[3], type: 'image' }
        ];
        authorData = { name: 'Alex Johnson', handle: '@alexj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' };
    } else if (i === 4) {
        content = 'Gallery demo: 2 images from my vacation! 🏖️';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[4], type: 'image' },
            { url: imagePlaceholders[5], type: 'image' }
        ];
        authorData = { name: 'Sarah Connor', handle: '@sarahc', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' };
    } else if (i === 5) {
        content = 'Gallery with 3 beautiful photos! Check them out 🌟';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[2], type: 'image' },
            { url: imagePlaceholders[4], type: 'image' },
            { url: imagePlaceholders[6], type: 'image' }
        ];
        authorData = { name: 'Michael Scott', handle: '@mscott', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' };
    } else if (i === 6) {
        content = 'Photoset: 5 amazing moments captured! 📷';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[0], type: 'image' },
            { url: imagePlaceholders[2], type: 'image' },
            { url: imagePlaceholders[4], type: 'image' },
            { url: imagePlaceholders[1], type: 'image' },
            { url: imagePlaceholders[5], type: 'image' }
        ];
        authorData = { name: 'Dwight Schrute', handle: '@dwights', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dwight' };
    } else if (i === 7) {
        content = 'Mixed media: Photos and videos combined! 🎬📸';
        media.media_url = null;
        media.gallery = [
            { url: imagePlaceholders[0], type: 'image' },
            { url: youtubePlaceholders[0], type: 'youtube' },
            { url: imagePlaceholders[3], type: 'image' },
            { url: imagePlaceholders[5], type: 'image' }
        ];
        authorData = { name: 'Pam Beesly', handle: '@pamb', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pam' };
    }

    mockPosts.push({
        id: i.toString(),
        content: content,
        created_at: getRandomDate(i),
        author_id: authorId,
        media_url: media.media_url,
        media_type: media.media_type,
        gallery: media.gallery,
        actions_count: counts.actions_count,
        replies_count: counts.replies_count,
        bookmark_count: counts.bookmark_count,
        shares_count: counts.shares_count,
        author: authorData
    });
}

// --- KẾT THÚC: DỮ LIỆU MOCK MỚI VỚI YOUTUBE LINKS ---

const Feed = () => {
    return (
        <div className="min-h-screen p-4 ">
            <div className="max-w-2xl mx-auto space-y-4">
                {mockPosts.map((item) => (
                    <FeedCard
                        key={item.id}
                        post={{
                            id: item.id,
                            content: item.content,
                            created_at: item.created_at,
                            author_id: item.author_id,
                            media_url: item.media_url,
                            media_type: item.media_type,
                            gallery: item.gallery,
                            actions_count: item.actions_count,
                            replies_count: item.replies_count,
                            bookmark_count: item.bookmark_count,
                            shares_count: item.shares_count
                        }}
                        author={item.author}
                    />
                ))}
            </div>
        </div>
    );
};

export default Feed;