import { differenceInMinutes } from "date-fns";
import { supabase } from "@/libs/supabaseClient";

/**
 * Format a date to YYYY-MM-DD (NY timezone)
 */
export function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

/**
 * Create a Date in America/New_York from "HH:mm"
 * — prevents UTC shifting
 */
export function parseTime(timeStr: string): Date {
  const [hour, minute] = timeStr.split(":").map(Number);

  // Determine today’s date in NY
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(now)
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {} as any);

  const year = parts.year;
  const month = parts.month;
  const day = parts.day;

  // Build ISO with explicit NY offset so time NEVER shifts
  const iso = `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${String(
    minute,
  ).padStart(2, "0")}:00`;

  // Let browser compute offset automatically
  return new Date(`${iso}-05:00`); // DST auto-adjusts
}

/**
 * Format Date to a US standard time string (e.g., "4:30 PM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Convert multiple 30-minute slots into readable ranges
 */
export function getTimeRanges(slots: { time: string }[]): string[] {
  if (!slots.length) return [];

  const ranges: string[] = [];
  let start = slots[0].time;
  let prev = parseTime(start);

  for (let i = 1; i < slots.length; i++) {
    const curr = parseTime(slots[i].time);

    if (differenceInMinutes(curr, prev) !== 30) {
      const end = new Date(prev.getTime() + 30 * 60000);
      ranges.push(`${formatTime(parseTime(start))} - ${formatTime(end)}`);
      start = slots[i].time;
    }

    prev = curr;
  }

  const finalEnd = new Date(prev.getTime() + 30 * 60000);
  ranges.push(`${formatTime(parseTime(start))} - ${formatTime(finalEnd)}`);

  return ranges;
}

/**
 * Fetch all booked slot IDs
 */
export async function fetchBookedSlotIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("booking_slots")
    .select("availability_id");

  if (error) {
    console.error("Error fetching booked slots:", error);
    return [];
  }

  return data.map((slot) => slot.availability_id);
}

/**
 * Number of slots needed per service
 */
export function getSlotsNeeded(
  serviceType: "reiki" | "tarot" | "combo" | "consultation",
): number {
  return {
    tarot: 1,
    reiki: 2,
    combo: 3,
    consultation: 1,
  }[serviceType];
}

/**
 * Validate 30-minute consecutive slots
 */
export function areConsecutive(
  slots: { time: string }[],
  selectedDate: string,
): boolean {
  for (let i = 1; i < slots.length; i++) {
    const prev = parseTime(slots[i - 1].time);
    const curr = parseTime(slots[i].time);
    if (curr.getTime() - prev.getTime() !== 30 * 60000) return false;
  }
  return true;
}

/**
 * Current time in NY timezone
 */
export function getNowInNY(): Date {
  const now = new Date();
  const nyString = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
  });
  return new Date(nyString);
}

/**
 * Today's date in YYYY-MM-DD (NY timezone)
 */
export function getTodayString(): string {
  return formatDate(getNowInNY());
}

export function formatUTCDate(utcString: string | undefined | null) {
  if (!utcString) return "";

  const date = new Date(utcString); // Date constructor parses UTC correctly
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC", // or omit to use user's local timezone
  });
}
