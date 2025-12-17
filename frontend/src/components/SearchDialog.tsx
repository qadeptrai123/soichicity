import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X, TrendingUp } from 'lucide-react';
import { searchService, type SearchUser, type SearchPost } from '@/services/searchService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<SearchUser[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [posts, setPosts] = useState<SearchPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const trendingTags = ['React 19', 'Next.js', 'TypeScript', 'Tailwind', 'Web Development'];

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 0) {
                setIsLoading(true);
                try {
                    const results = await searchService.search(searchQuery);
                    setUsers(results.users.hits);
                    setPosts(results.posts.hits);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setUsers([]);
                setPosts([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleUserClick = (username: string) => {
        navigate(`/@${username}`);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <div className="grid grid-cols-1 lg:grid-cols-4">
                <div className="hidden lg:block"></div>
                <DialogContent className="max-w-[600px]! p-0 bg-backgroundfeed border-border rounded-2xl [&>button]:hidden h-[600px] flex flex-col lg:col-span-2">
                    {/* Search Header */}
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3 bg-input rounded-2xl px-4 py-2">
                            <Search className="w-5 h-5 text-text-muted" />
                            <Input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 bg-input text-foreground placeholder:text-text-muted focus-visible:ring-0"
                                autoFocus
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Trending Section - Show only when no search query */}
                        {!searchQuery && (
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center gap-2 mb-3 text-foreground">
                                    <TrendingUp className="w-5 h-5" />
                                    <h3 className="">Trending</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {trendingTags.map((tag) => (
                                        <button
                                            key={tag}
                                            className="px-3 py-1.5 bg-input hover:bg-border rounded-full text-sm text-text-secondary"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {isLoading ? (
                            <div className="p-8 text-center text-text-muted">Loading...</div>
                        ) : (
                            <div className="p-4 space-y-6">
                                {/* Users Results */}
                                {users.length > 0 && (
                                    <div>
                                        <h3 className="text-foreground mb-4 font-semibold">People</h3>
                                        <div className="space-y-3">
                                            {users.map((user) => (
                                                <div
                                                    key={user.objectID}
                                                    className="flex items-center justify-between hover:bg-input/50 p-2 rounded-lg cursor-pointer transition-colors"
                                                    onClick={() => handleUserClick(user.username)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={user.avatar_url || undefined} />
                                                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-foreground font-medium">{user.full_name || user.username}</p>
                                                            <p className="text-text-secondary text-sm">
                                                                @{user.username}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* Follow button could go here, need connection state */}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No results state */}
                                {searchQuery && users.length === 0 && posts.length === 0 && (
                                    <div className="text-center text-text-muted py-8">
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
                <div className="hidden lg:block"></div>
            </div>
        </Dialog>
    );
}
