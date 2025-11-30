"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Smile } from "lucide-react";
// import { EmojiPicker } from "frimousse";

import EmojiPicker, { Theme } from 'emoji-picker-react';


export default function EmojiButton() {
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [chosenEmoji, setChosenEmoji] = useState(null);

    const onEmojiClick = (emojiObject: any) => {
        setChosenEmoji(emojiObject);
    };


    return (
        <Popover onOpenChange={setShowEmojiPicker} open={showEmojiPicker}>
            <PopoverTrigger asChild className="p-0">
                <Button className="text-text-secondary hover:text-foreground transition bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-white/5"><Smile size={20} /> </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0 border-none z-[100] shadow-2xl">
                {/* <EmojiPicker.Root className="isolate flex h-[368px] w-fit flex-col bg-secondary rounded-lg">
                    <EmojiPicker.Search className="z-10 mx-2 mt-2 appearance-none rounded-md bg-input px-2.5 py-2 text-sm" />
                    <EmojiPicker.Viewport className="relative flex-1 outline-hidden no-scrollbar">
                        <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-secondary text-sm">
                            Loading…
                        </EmojiPicker.Loading>
                        <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-secondary text-sm">
                            No emoji found.
                        </EmojiPicker.Empty>
                        <EmojiPicker.List
                            className="select-none pb-1.5"
                            components={{
                                CategoryHeader: ({ category, ...props }) => (
                                    <div
                                        className="bg-secondary px-3 pt-3 pb-1.5 font-medium text-text-secondary text-xs"
                                        {...props}
                                    >
                                        {category.label}
                                    </div>
                                ),
                                Row: ({ children, ...props }) => (
                                    <div className="scroll-my-1.5 px-1.5" {...props}>
                                        {children}
                                    </div>
                                ),
                                Emoji: ({ emoji, ...props }) => (
                                    <Button
                                        className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-secondary bg-secondary hover:bg-secondary"
                                        {...props}
                                    >
                                        {emoji.emoji}
                                    </Button>
                                ),
                            }}
                        />
                    </EmojiPicker.Viewport>
                </EmojiPicker.Root> */}
                <EmojiPicker
                    theme={Theme.DARK}
                />

            </PopoverContent>
        </Popover>

    )
}