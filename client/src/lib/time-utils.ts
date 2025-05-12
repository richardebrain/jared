/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Formats a time to a user-friendly string based on the time zone
 */
export function formatTimeToUserFriendly(date: Date, timeZone: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: normalizeTimeZone(timeZone)
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    // Fallback if the time zone is not valid
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

/**
 * Formats a date to a user-friendly string based on the time zone
 */
export function formatDateToUserFriendly(date: Date, timeZone: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: normalizeTimeZone(timeZone)
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    // Fallback if the time zone is not valid
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

/**
 * Normalizes a time zone string from UTC format to IANA format
 * e.g. UTC+01:00 -> Etc/GMT-1
 * Note: IANA format has the opposite sign of UTC
 */
function normalizeTimeZone(timeZone: string): string {
  if (!timeZone.startsWith('UTC')) {
    return timeZone; // Assume it's already in IANA format
  }
  
  try {
    const match = timeZone.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (!match) {
      return 'UTC'; // Default to UTC if format is not recognized
    }
    
    const [_, sign, hours, minutes] = match;
    const offsetSign = sign === '+' ? '-' : '+'; // Invert the sign for IANA format
    
    if (hours === '00' && minutes === '00') {
      return 'UTC';
    }
    
    let offsetHours = parseInt(hours, 10);
    const offsetMinutes = parseInt(minutes, 10);
    
    // Format as Etc/GMT+X or Etc/GMT-X
    // Note: Etc/GMT uses the opposite sign convention from UTC
    if (offsetMinutes === 0) {
      return `Etc/GMT${offsetSign}${offsetHours}`;
    }
    
    // For non-whole hour offsets, return a close approximation
    // with a whole hour value (as Etc/GMT doesn't support minutes)
    if (offsetMinutes >= 30) {
      offsetHours += 1;
    }
    
    return `Etc/GMT${offsetSign}${offsetHours}`;
  } catch (error) {
    console.error("Error normalizing time zone:", error);
    return 'UTC';
  }
}

/**
 * Converts a time from one time zone to another
 */
export function convertTime(
  date: Date, 
  fromTimeZone: string, 
  toTimeZone: string
): Date {
  try {
    // Get the date in the format that includes the time zone information
    const fromTzDate = new Date(date.toLocaleString('en-US', { timeZone: normalizeTimeZone(fromTimeZone) }));
    const toTzDate = new Date(date.toLocaleString('en-US', { timeZone: normalizeTimeZone(toTimeZone) }));
    
    // Calculate the offset between the two time zones
    const offset = toTzDate.getTime() - fromTzDate.getTime();
    
    // Create a new date with the offset applied
    return new Date(date.getTime() + offset);
  } catch (error) {
    console.error("Error converting time:", error);
    return date; // Return the original date if there's an error
  }
}

/**
 * Calculates the time difference between two time zones in hours
 */
export function getTimeZoneDifference(timeZone1: string, timeZone2: string): number {
  try {
    // Use the same reference date for both time zones
    const date = new Date();
    
    // Get the date in both time zones
    const date1 = new Date(date.toLocaleString('en-US', { timeZone: normalizeTimeZone(timeZone1) }));
    const date2 = new Date(date.toLocaleString('en-US', { timeZone: normalizeTimeZone(timeZone2) }));
    
    // Calculate the difference in hours
    const diffInHours = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
    
    return Math.round(diffInHours * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error("Error calculating time zone difference:", error);
    return 0;
  }
}

/**
 * Gets the user's local time zone as a UTC string
 */
export function getUserTimeZone(): string {
  const offset = -new Date().getTimezoneOffset() / 60;
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset).toString().padStart(2, "0");
  const minutes = ((absOffset - Math.floor(absOffset)) * 60).toString().padStart(2, "0");
  
  return `UTC${sign}${hours}:${minutes}`;
}
