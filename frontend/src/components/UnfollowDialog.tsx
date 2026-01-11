import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";

interface UnfollowDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    username: string;
    avatarUrl?: string;
    isPending?: boolean;
}

export function UnfollowDialog({ isOpen, onClose, onConfirm, username, avatarUrl, isPending }: UnfollowDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                onClick={(e) => e.stopPropagation()}
                className="sm:max-w-[320px] p-0 gap-0 overflow-hidden bg-secondary border-border text-white"
            >
                <div className="flex flex-col items-center gap-4 text-center p-8 pb-6">
                    <Avatar className="w-16 h-16 border-2 border-background">
                        <AvatarImage src={avatarUrl || DEFAULT_AVATAR_URL} />
                        <AvatarFallback className="text-xl">{username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-center text-xl font-bold">Unfollow @{username}?</DialogTitle>
                        <DialogDescription className="sr-only">
                            Are you sure you want to unfollow @{username}? You will not see their posts in your home feed.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex w-full border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="flex-1 h-12 rounded-none border-r border-border text-white hover:bg-white/5 hover:text-white font-normal text-base"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        disabled={isPending}
                        className="flex-1 h-12 rounded-none text-red-500 hover:bg-white/5 hover:text-red-500 font-bold text-base"
                    >
                        {isPending ? "Unfollowing..." : "Unfollow"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
