/**
 * Timezone Utility
 * Provides functions to get timezones based on countries and format timezone information
 *
 * @example
 * // Get all timezones
 * const allTimezones = getAllTimezones();
 *
 * @example
 * // Get timezones for a specific country (e.g., US)
 * const usTimezones = getTimezonesByCountry("US");
 *
 * @example
 * // Get timezones grouped by country
 * const grouped = getTimezonesGroupedByCountry();
 * const usTimezones = grouped["US"]; // Array of US timezones
 *
 * @example
 * // Get current device timezone
 * const currentTz = getCurrentTimezone(); // e.g., "America/New_York"
 *
 * @example
 * // Find timezone by search term
 * const tz = findTimezone("New York"); // Returns TimezoneOption
 */

export interface TimezoneOption {
  id: string; // IANA timezone identifier (e.g., "America/New_York")
  label: string; // Formatted label (e.g., "(UTC-05:00) Eastern Time (US and Canada)")
  offset: string; // UTC offset (e.g., "UTC-05:00")
  countryCode?: string; // ISO 3166-1 alpha-2 country code
  countryName?: string; // Country name
  city?: string; // City name
}

/**
 * Get the current device timezone
 */
export const getCurrentTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error("Error getting current timezone:", error);
    return "UTC";
  }
};

/**
 * Parse a string like "GMT-5", "GMT+5:30", "UTC-05:00" into "UTC±HH:MM"
 */
function parseOffsetString(value: string): string | null {
  if (!value || typeof value !== "string") return null;
  // Normalize: replace GMT with UTC, and Unicode minus (U+2212) with ASCII minus
  const s = value
    .trim()
    .replace(/\u2212/g, "-")
    .replace(/^GMT/i, "UTC");
  // Match optional UTC/GMT prefix then sign and digits: (UTC)? (+|-)(\d{1,2})(:(\d{2}))?
  const match =
    s.match(/UTC?\s*([+-])(\d{1,2})(?::(\d{2}))?/i) ??
    s.match(/^([+-])(\d{1,2})(?::(\d{2}))?/);
  if (match) {
    const sign = match[1];
    const hours = (match[2] ?? "0").padStart(2, "0");
    const minutes = (match[3] ?? "00").padStart(2, "0");
    return `UTC${sign}${hours}:${minutes}`;
  }
  return null;
}

/**
 * Get UTC offset for a timezone (e.g. "UTC-05:00", "UTC+05:30")
 */
export const getTimezoneOffset = (timezone: string): string => {
  try {
    if (!timezone || typeof timezone !== "string") {
      console.warn("Invalid timezone provided:", timezone);
      return "UTC+00:00";
    }

    const now = new Date();

    // 1) Try formatToParts with timeZoneName (may not work in React Native/Hermes)
    for (const timeZoneName of ["longOffset", "shortOffset"] as const) {
      try {
        const formatter = new Intl.DateTimeFormat("en", {
          timeZone: timezone,
          timeZoneName,
        });
        const parts = formatter.formatToParts(now);
        const offsetPart = parts.find((part) => part.type === "timeZoneName");
        if (offsetPart?.value) {
          const parsed = parseOffsetString(offsetPart.value);
          if (parsed) return parsed;
        }
        // Hermes can split "GMT-10" into multiple parts; try reconstructing from full format
        const full = formatter.format(now);
        const gmtMatch =
          full.match(/GMT\s*[+-]\d{1,2}(?::\d{2})?/i) ??
          full.match(/UTC\s*[+-]\d{1,2}(?::\d{2})?/i);
        if (gmtMatch) {
          const parsed = parseOffsetString(gmtMatch[0]);
          if (parsed) return parsed;
        }
      } catch {
        continue;
      }
    }

    // 2) Fallback: compute offset by comparing UTC time to timezone time for the same instant
    const utcFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tzFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const utcParts = utcFormatter.formatToParts(now);
    const tzParts = tzFormatter.formatToParts(now);
    const getHM = (p: Intl.DateTimeFormatPart[]) => ({
      h: parseInt(p.find((x) => x.type === "hour")?.value ?? "0", 10),
      m: parseInt(p.find((x) => x.type === "minute")?.value ?? "0", 10),
    });
    const utc = getHM(utcParts);
    const tz = getHM(tzParts);
    let offsetMinutes = tz.h * 60 + tz.m - (utc.h * 60 + utc.m);
    // Normalize to roughly [-12*60, +14*60]
    if (offsetMinutes > 14 * 60) offsetMinutes -= 24 * 60;
    if (offsetMinutes < -12 * 60) offsetMinutes += 24 * 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hours = Math.floor(abs / 60)
      .toString()
      .padStart(2, "0");
    const mins = (abs % 60).toString().padStart(2, "0");
    return `UTC${sign}${hours}:${mins}`;
  } catch (error) {
    console.warn("Error getting timezone offset for:", timezone, error);
    if (timezone === "America/Honolulu") return "UTC-10:00";
    return "UTC+00:00";
  }
};

/**
 * Get timezone name (city/region) for display
 */
export const getTimezoneName = (timezone: string): string => {
  try {
    // Extract city/region name from IANA timezone (e.g., "America/New_York" -> "New York")
    const parts = timezone.split("/");
    if (parts.length > 1) {
      return parts[parts.length - 1].replace(/_/g, " ");
    }
    return timezone;
  } catch {
    return timezone;
  }
};

/**
 * Get country code from timezone (approximate mapping)
 * Note: This is an approximation as IANA timezones don't directly map to countries
 */
export const getCountryCodeFromTimezone = (
  timezone: string,
): string | undefined => {
  // Common timezone to country code mappings
  const timezoneToCountry: Record<string, string> = {
    // US Timezones
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Los_Angeles": "US",
    "America/Phoenix": "US",
    "America/Anchorage": "US",
    "America/Detroit": "US",
    "America/Indianapolis": "US",
    "America/Boise": "US",
    "America/Menominee": "US",
    "America/Juneau": "US",
    "America/Sitka": "US",
    "America/Metlakatla": "US",
    "America/Yakutat": "US",
    "America/Nome": "US",
    "America/Adak": "US",
    "America/Honolulu": "US",

    // Canada Timezones
    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "America/Edmonton": "CA",
    "America/Winnipeg": "CA",
    "America/Halifax": "CA",
    "America/St_Johns": "CA",
    "America/Regina": "CA",
    "America/Yellowknife": "CA",
    "America/Whitehorse": "CA",
    "America/Dawson": "CA",
    "America/Moncton": "CA",
    "America/Glace_Bay": "CA",
    "America/Goose_Bay": "CA",
    "America/Blanc-Sablon": "CA",
    "America/Montreal": "CA",
    "America/Thunder_Bay": "CA",

    // UK
    "Europe/London": "GB",

    // European countries
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Rome": "IT",
    "Europe/Madrid": "ES",
    "Europe/Amsterdam": "NL",
    "Europe/Brussels": "BE",
    "Europe/Vienna": "AT",
    "Europe/Zurich": "CH",
    "Europe/Stockholm": "SE",
    "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK",
    "Europe/Helsinki": "FI",
    "Europe/Warsaw": "PL",
    "Europe/Prague": "CZ",
    "Europe/Budapest": "HU",
    "Europe/Athens": "GR",
    "Europe/Lisbon": "PT",
    "Europe/Dublin": "IE",

    // Asia
    "Asia/Tokyo": "JP",
    "Asia/Shanghai": "CN",
    "Asia/Hong_Kong": "HK",
    "Asia/Singapore": "SG",
    "Asia/Seoul": "KR",
    "Asia/Dubai": "AE",
    "Asia/Kolkata": "IN",
    "Asia/Karachi": "PK",
    "Asia/Dhaka": "BD",
    "Asia/Bangkok": "TH",
    "Asia/Jakarta": "ID",
    "Asia/Manila": "PH",
    "Asia/Ho_Chi_Minh": "VN",
    "Asia/Riyadh": "SA",
    "Asia/Tehran": "IR",
    "Asia/Baghdad": "IQ",
    "Asia/Jerusalem": "IL",
    "Asia/Amman": "JO",
    "Asia/Beirut": "LB",
    "Asia/Damascus": "SY",
    "Asia/Nicosia": "CY",

    // Australia
    "Australia/Sydney": "AU",
    "Australia/Melbourne": "AU",
    "Australia/Brisbane": "AU",
    "Australia/Perth": "AU",
    "Australia/Adelaide": "AU",
    "Australia/Darwin": "AU",
    "Australia/Hobart": "AU",

    // New Zealand
    "Pacific/Auckland": "NZ",

    // South America
    "America/Sao_Paulo": "BR",
    "America/Buenos_Aires": "AR",
    "America/Lima": "PE",
    "America/Bogota": "CO",
    "America/Santiago": "CL",
    "America/Caracas": "VE",
    "America/Mexico_City": "MX",

    // Africa
    "Africa/Cairo": "EG",
    "Africa/Johannesburg": "ZA",
    "Africa/Lagos": "NG",
    "Africa/Nairobi": "KE",
    "Africa/Casablanca": "MA",
  };

  return timezoneToCountry[timezone];
};

/**
 * Get all available timezones
 */
export const getAllTimezones = (): TimezoneOption[] => {
  try {
    // Get all IANA timezones
    // Note: Intl.supportedValuesOf is available in modern environments
    // For React Native, we'll use a comprehensive list
    const timezones = getCommonTimezones();

    return timezones.map((tz) => {
      const offset = getTimezoneOffset(tz);
      const name = getTimezoneName(tz);
      const countryCode = getCountryCodeFromTimezone(tz);

      return {
        id: tz,
        label: `(${offset}) ${name}`,
        offset,
        countryCode,
        city: name,
      };
    });
  } catch (error) {
    console.error("Error getting all timezones:", error);
    return [];
  }
};

/**
 * Get timezones for a specific country code
 */
export const getTimezonesByCountry = (
  countryCode: string,
): TimezoneOption[] => {
  const allTimezones = getAllTimezones();
  return allTimezones.filter(
    (tz) => tz.countryCode === countryCode.toUpperCase(),
  );
};

/**
 * Get timezones grouped by country
 */
export const getTimezonesGroupedByCountry = (): Record<
  string,
  TimezoneOption[]
> => {
  const allTimezones = getAllTimezones();
  const grouped: Record<string, TimezoneOption[]> = {};

  allTimezones.forEach((tz) => {
    if (tz.countryCode) {
      if (!grouped[tz.countryCode]) {
        grouped[tz.countryCode] = [];
      }
      grouped[tz.countryCode].push(tz);
    }
  });

  return grouped;
};

/**
 * Find timezone by label or ID
 */
export const findTimezone = (
  searchTerm: string,
): TimezoneOption | undefined => {
  const allTimezones = getAllTimezones();
  const normalizedSearch = searchTerm.toLowerCase().trim();

  return allTimezones.find(
    (tz) =>
      tz.id.toLowerCase().includes(normalizedSearch) ||
      tz.label.toLowerCase().includes(normalizedSearch) ||
      tz.city?.toLowerCase().includes(normalizedSearch) ||
      tz.countryName?.toLowerCase().includes(normalizedSearch),
  );
};

/**
 * Get common timezones list
 * This is a comprehensive list of commonly used IANA timezones
 */
const getCommonTimezones = (): string[] => {
  return [
    // US Timezones
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Honolulu",

    // Canada Timezones
    "America/Toronto",
    "America/Vancouver",
    "America/Edmonton",
    "America/Winnipeg",
    "America/Halifax",
    "America/St_Johns",

    // UK and Europe
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Madrid",
    "Europe/Amsterdam",
    "Europe/Brussels",
    "Europe/Vienna",
    "Europe/Zurich",
    "Europe/Stockholm",
    "Europe/Oslo",
    "Europe/Copenhagen",
    "Europe/Helsinki",
    "Europe/Warsaw",
    "Europe/Prague",
    "Europe/Budapest",
    "Europe/Athens",
    "Europe/Lisbon",
    "Europe/Dublin",
    "Europe/Moscow",
    "Europe/Kiev",
    "Europe/Istanbul",

    // Asia
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Hong_Kong",
    "Asia/Singapore",
    "Asia/Seoul",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Karachi",
    "Asia/Dhaka",
    "Asia/Bangkok",
    "Asia/Jakarta",
    "Asia/Manila",
    "Asia/Ho_Chi_Minh",
    "Asia/Riyadh",
    "Asia/Tehran",
    "Asia/Jerusalem",

    // Australia
    "Australia/Sydney",
    "Australia/Melbourne",
    "Australia/Brisbane",
    "Australia/Perth",
    "Australia/Adelaide",
    "Australia/Darwin",

    // New Zealand
    "Pacific/Auckland",

    // South America
    "America/Sao_Paulo",
    "America/Buenos_Aires",
    "America/Lima",
    "America/Bogota",
    "America/Santiago",
    "America/Mexico_City",

    // Africa
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Casablanca",
  ];
};

/**
 * Format timezone for display in a user-friendly way
 */
export const formatTimezoneLabel = (timezone: TimezoneOption): string => {
  return timezone.label;
};

/**
 * Format offset for display as UTC±HH:MM (e.g. UTC-05:00, UTC+05:00).
 * Use this when displaying TimezoneOption.offset in the UI.
 */
export const formatOffsetForDisplay = (offset: string): string => {
  if (!offset || typeof offset !== "string") return "UTC+00:00";
  const s = offset.trim().replace(/^GMT/i, "UTC");
  const match =
    s.match(/UTC?\s*([+-])(\d{1,2}):?(\d{2})?/i) ||
    s.match(/^([+-])(\d{1,2}):?(\d{2})?/);
  if (match) {
    const sign = match[1];
    const hours = (match[2] ?? "0").padStart(2, "0");
    const minutes = (match[3] ?? "00").padStart(2, "0");
    return `UTC${sign}${hours}:${minutes}`;
  }
  if (s.startsWith("UTC")) return s;
  return `UTC+${s}`;
};

/**
 * Get timezone by IANA identifier
 */
export const getTimezoneById = (
  timezoneId: string,
): TimezoneOption | undefined => {
  const allTimezones = getAllTimezones();
  return allTimezones.find((tz) => tz.id === timezoneId);
};
