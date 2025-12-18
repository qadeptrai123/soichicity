import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownAction {
  id: string;
  label: string;
  icon?: React.ReactNode; // Icon (eg: Bookmark, Edit3, etc.)
  onClick?: () => void;
  variant?: "default" | "destructive"; // default = white text, destructive = red text (eg: Block, Remove,..)
  isActive?: boolean; // Use for Feed Filter (to show Checkmark)
  showSeparatorAfter?: boolean; // Separator line after this item
  /* when config page has some actions hidden based on user role/permission
  need declare a variable to control visibility of action item (owner, admin, guest, ...)
  */
  isVisible?: boolean; // true = show dropdown, false = hide dropdown
}

// Interface for DropdownExtend props
interface DropdownExtendProps {
  actions: DropdownAction[];
  triggerType?: "icon" | "text"; // "icon" = 3-dot icon, "text" = text with chevron
  triggerLabel?: string;
  align?: "end" | "start" | "center";
}

// --- MAIN COMPONENT ---
export function DropdownExtend({
  actions,
  triggerType = "icon",
  triggerLabel,
  align = "end",
}: DropdownExtendProps) {
  // Filter actions based on isVisible property
  const validActions = actions.filter((action) => action.isVisible !== false);
  if (validActions.length === 0) {
    return null; // If no visible actions, render nothing
  }
  return (
    <DropdownMenu modal={false}>
      {/* 1. Trigger (Button) */}
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 transition-colors focus:outline-none",
            // Style for Icon (... menu extend)
            triggerType === "icon" && "text-[#5C5C7B] hover:text-white",
            // Style for Text (Feed Filter)
            triggerType === "text" && "text-white font-semibold text-[15px]"
          )}
        >
          {triggerType === "icon" ? (
            <MoreHorizontal size={20} />
          ) : (
            <>
              {triggerLabel}
              <ChevronDown size={16} className="mt-0.5 text-gray-400" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      {/* 2. Content (Dropdown menu content) */}
      <DropdownMenuContent
        align={align}
        sideOffset={8}
        className={cn(
          "w-[224px] p-[9px] rounded-[14px]",
          "bg-[#1A1F2E] border border-[#2A2F3E]",
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
          "text-gray-200 flex flex-col" // flex-col để xếp item dọc
        )}
      >
        {validActions.map((action) => (
          <React.Fragment key={action.id}>
            <DropdownMenuItem
              onClick={action.onClick}
              variant={action.variant} // Use the variant from the original file to handle basic hover
              className={cn(
                // Base Styles:
                "cursor-pointer w-full py-3 px-3 rounded-lg text-[15px] font-medium transition-colors outline-none",
                "flex justify-between items-center", // Text bên trái, Icon bên phải (quan trọng!)

                // Hover States:
                // When hover, background lightens a bit (#2A2F3E matches border color)
                "focus:bg-[#2A2F3E] focus:text-white",

                // Handle "destructive" variant (Red color)
                action.variant === "destructive" &&
                "text-[#FF4D4D] focus:bg-[#FF4D4D]/10 focus:text-[#FF4D4D]"
              )}
            >
              {/* Label (Left side) */}
              <span>{action.label}</span>

              {/* Icon or Checkmark (Right side) */}
              <span
                className={cn(
                  "opacity-70 flex items-center justify-center drop-shadow-lg",
                  action.variant === "destructive"
                    ? "text-[#FB2C36]"
                    : "text-[#717182]", // Icon usually gray-purple
                  action.isActive && "opacity-100 text-white" // If active (Filter), brighten up
                )}
              >
                {/* If active, show checkmark; otherwise, show regular icon */}
                {action.isActive ? <Check size={18} /> : action.icon}
              </span>
            </DropdownMenuItem>

            {/* Separator line  */}
            {action.showSeparatorAfter && (
              <DropdownMenuSeparator className="bg-[#2A2F3E] my-1 h-[1px]" />
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
