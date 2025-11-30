import { EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch } from "./ui/emoji-picker";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Smile } from "lucide-react";


export default function EmojiButton() {
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    return (
        <div>
            <Popover onOpenChange={setShowEmojiPicker} open={showEmojiPicker}>
                <PopoverTrigger asChild>
                    <Button className="bg-secondary"><Smile size={20} /> </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0">
                    <EmojiPicker
                        className="h-[342px] bg-secondary"
                        onEmojiSelect={({ emoji }) => {
                            setShowEmojiPicker(false);
                            console.log(emoji);
                        }}
                    >
                        <EmojiPickerSearch />
                        <EmojiPickerContent />
                        <EmojiPickerFooter />
                    </EmojiPicker>
                </PopoverContent>
            </Popover>
        </div>
    )
}