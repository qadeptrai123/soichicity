import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, TrendingUp } from 'lucide-react';

interface User {
    id: string;
    name: string;
    username: string;
    followers: string;
    avatar: string;
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [searchQuery, setSearchQuery] = useState('');

    const trendingTags = ['React 19', 'Next.js', 'TypeScript', 'Tailwind', 'Web Development'];

    const suggestedUsers: User[] = [
        { id: '1', name: 'Sarah Chen', username: '@sarahchen', followers: '12.5K', avatar: 'S' },
        { id: '2', name: 'Mike Johnson', username: '@mikej', followers: '18.2K', avatar: 'M' },
        { id: '3', name: 'Emma Davis', username: '@emmadavis', followers: '9.8K', avatar: 'E' },
        { id: '4', name: 'Alex Park', username: '@alexpark', followers: '15.3K', avatar: 'A' },
        { id: '5', name: 'Chris Martinez', username: '@chrism', followers: '7.6K', avatar: 'S' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 bg-gray-900 border-gray-800">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3 bg-gray-800 rounded-full px-4 py-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Trending Section */}
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2 mb-3 text-white">
                        <TrendingUp className="w-5 h-5" />
                        <h3 className="font-semibold">Trending</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingTags.map((tag) => (
                            <button
                                key={tag}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-300"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Suggested Users */}
                <div className="p-4">
                    <h3 className="font-semibold text-white mb-4">Suggested</h3>
                    <div className="space-y-3">
                        {suggestedUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold">
                                        {user.avatar}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{user.name}</p>
                                        <p className="text-gray-400 text-sm">
                                            {user.username} {user.followers} followers
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white text-black hover:bg-gray-200 rounded-full px-4"
                                >
                                    Follow
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}