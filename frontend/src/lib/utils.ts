import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict, format } from "date-fns";
import { enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatRelativeTime = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return "";
  try {
    let date: Date;
    if (typeof dateInput === "string") {
      // If the string does not contain timezone info (Z or +00:00), assume it is UTC and append Z
      // Python's datetime.utcnow().isoformat() creates a naive datetime string like "2023-10-27T10:00:00.000000"
      if (!dateInput.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateInput)) {
        date = new Date(dateInput + "Z");
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    if (diffInMs > sevenDaysInMs) {
      if (date.getFullYear() === now.getFullYear()) {
        return format(date, "HH:mm · MMM d");
      }
      return format(date, "HH:mm · MMM d, yyyy");
    }

    const distance = formatDistanceToNowStrict(date, {
      addSuffix: false,
      locale: {
        ...enUS,
        formatDistance: (token, count, options) => {
          const format: Record<string, string> = {
            xSeconds: 'Just now',
            lessThanXSeconds: 'Just now',
            halfAMinute: '30s',
            lessThanXMinutes: `${count}m`,
            xMinutes: `${count}m`,
            aboutXHours: `${count}h`,
            xHours: `${count}h`,
            xDays: `${count}d`,
            aboutXWeeks: `${count}w`,
            xWeeks: `${count}w`,
            aboutXMonths: `${count}mo`,
            xMonths: `${count}mo`,
            aboutXYears: `${count}y`,
            xYears: `${count}y`,
            overXYears: `${count}y`,
            almostXYears: `${count}y`,
          }

          return format[token] || `${count}m`;
        }
      }
    });
    return distance;
  } catch (e) {
    return "";
  }
};

/**
 * Parse text content to identify @mentions and return segments with metadata
 * @param content - The text content to parse
 * @returns Array of segments with type and content
 */
export const parseTextWithMentions = (content: string): Array<{
  type: 'text' | 'mention';
  content: string;
  username?: string;
}> => {
  if (!content) return [];
  
  // Regex to match @username (alphanumeric and underscore)
  const mentionRegex = /@(\w+)/g;
  const segments: Array<{ type: 'text' | 'mention'; content: string; username?: string }> = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    
    // Add mention
    segments.push({
      type: 'mention',
      content: match[0], // @username
      username: match[1] // username without @
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }
  
  return segments;
};
