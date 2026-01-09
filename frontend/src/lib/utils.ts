import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict, differenceInDays, format } from "date-fns";
import { enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatRelativeTime = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return "";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();

    if (differenceInDays(now, date) > 7) {
      if (date.getFullYear() === now.getFullYear()) {
        return format(date, "MMM d");
      }
      return format(date, "MMM d, yyyy");
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
