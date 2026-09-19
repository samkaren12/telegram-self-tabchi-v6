/**
 * Iran Standard Time (IRST) Utility
 * 
 * Note: Iran officially abolished Daylight Saving Time (DST) permanently in 1401 (2022).
 * Iran Standard Time is permanently and strictly UTC+03:30 (3 hours and 30 minutes ahead of UTC).
 */

export const TEHRAN_OFFSET_MS = 3.5 * 3600 * 1000; // +03:30 in milliseconds

/**
 * Returns a Date object adjusted such that its UTC methods (getUTCHours, etc.)
 * represent the exact current Iran/Tehran time.
 */
export function getTehranDate(baseDate: Date = new Date()): Date {
  return new Date(baseDate.getTime() + TEHRAN_OFFSET_MS);
}

/**
 * Returns Tehran time hours, minutes, seconds as zero-padded 2-digit strings.
 */
export function getTehranTimeParts(baseDate: Date = new Date()): {
  hours: string;
  minutes: string;
  seconds: string;
  hours12: string;
  ampmUpper: string;
  ampmLower: string;
} {
  const tehran = getTehranDate(baseDate);
  const H = tehran.getUTCHours();
  const m = tehran.getUTCMinutes();
  const s = tehran.getUTCSeconds();

  const hours = String(H).padStart(2, "0");
  const minutes = String(m).padStart(2, "0");
  const seconds = String(s).padStart(2, "0");

  const h12 = H % 12 || 12;
  const hours12 = String(h12).padStart(2, "0");
  const ampmUpper = H >= 12 ? "PM" : "AM";
  const ampmLower = H >= 12 ? "pm" : "am";

  return {
    hours,
    minutes,
    seconds,
    hours12,
    ampmUpper,
    ampmLower,
  };
}

/**
 * Formats date strictly in Iran Standard Time (Asia/Tehran) according to pattern:
 * - HH: 24-hour hour (00-23)
 * - H: 24-hour hour (0-23)
 * - hh: 12-hour hour (01-12)
 * - h: 12-hour hour (1-12)
 * - mm: minutes (00-59)
 * - m: minutes (0-59)
 * - ss: seconds (00-59)
 * - s: seconds (0-59)
 * - A: AM / PM
 * - a: am / pm
 */
export function formatTehranTime(fmt = "HH:mm", baseDate: Date = new Date()): string {
  const tehran = getTehranDate(baseDate);
  const H = tehran.getUTCHours();
  const m = tehran.getUTCMinutes();
  const s = tehran.getUTCSeconds();

  const HH = String(H).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  const h12 = H % 12 || 12;
  const hh = String(h12).padStart(2, "0");
  const A = H >= 12 ? "PM" : "AM";
  const a = H >= 12 ? "pm" : "am";

  return fmt
    .replace("HH", HH)
    .replace("hh", hh)
    .replace("H", String(H))
    .replace("h", String(h12))
    .replace("mm", mm)
    .replace("m", String(m))
    .replace("ss", ss)
    .replace("s", String(s))
    .replace("A", A)
    .replace("a", a);
}
