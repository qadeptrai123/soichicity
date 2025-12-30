import { cn } from "@/lib/utils";
import React from "react";

interface AnimateEntranceProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /**
     * Animation type
     * @default "fade"
     */
    type?: "fade" | "zoom" | "slide-up" | "slide-down" | "slide-left" | "slide-right";
    /**
     * Delay in milliseconds
     * @default 0
     */
    delay?: number;
    /**
     * Duration class (e.g. duration-300, duration-500)
     * @default "duration-500"
     */
    duration?: string;
    viewport?: boolean; // if true, animate only when in viewport (requires IntersectionObserver, keep simple for now or use library)
}

export default function AnimateEntrance({
    children,
    type = "fade",
    delay = 0,
    duration = "duration-500",
    className,
    ...props
}: AnimateEntranceProps) {

    // Mapping types to tailwindcss-animate classes
    const getAnimationClass = () => {
        switch (type) {
            case "zoom":
                return "animate-in fade-in zoom-in-95";
            case "slide-up":
                return "animate-in fade-in slide-in-from-bottom-4";
            case "slide-down":
                return "animate-in fade-in slide-in-from-top-4";
            case "slide-left":
                return "animate-in fade-in slide-in-from-right-8";
            case "slide-right":
                return "animate-in fade-in slide-in-from-left-8";
            case "fade":
            default:
                return "animate-in fade-in";
        }
    };

    // Construct style for delay since tailwind delay utility is limited or we want precise control
    const style = {
        animationDelay: `${delay}ms`,
        animationFillMode: "both", // ensure it stays in end state
        ...props.style
    };

    return (
        <div
            className={cn(getAnimationClass(), duration, className)}
            style={style}
            {...props}
        >
            {children}
        </div>
    );
}
