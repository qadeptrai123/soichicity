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
