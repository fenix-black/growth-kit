/**
 * Utility functions for handling location data
 */

/**
 * Decode URL-encoded unicode characters in location strings
 * @param value The URL-encoded string to decode
 * @returns The decoded string or original value if decoding fails
 */
export function decodeLocationString(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') {
    return value || null;
  }

  try {
    // First try to decode URI component in case it's URL encoded
    const decoded = decodeURIComponent(value);
    return decoded;
  } catch (error) {
    // If decoding fails, return original value
    // This handles cases where the string is already decoded or contains invalid encoding
    console.warn('Failed to decode location string:', value, error);
    return value;
  }
}

/**
 * Safe function to decode location object with city and country
 * @param location Location object with potential URL-encoded strings
 * @returns Location object with decoded strings
 */
export function decodeLocationData(location: any): { city: string | null; country: string | null; region: string | null } | null {
  if (!location || typeof location !== 'object') {
    return null;
  }

  return {
    city: decodeLocationString(location.city),
    country: decodeLocationString(location.country),
    region: decodeLocationString(location.region),
  };
}

/**
 * Format location for display (city, country or just country)
 * @param location The location object to format
 * @returns Formatted location string for display
 */
export function formatLocationForDisplay(location: any): string {
  const decodedLocation = decodeLocationData(location);
  
  if (!decodedLocation) {
    return '';
  }

  const { city, country } = decodedLocation;

  if (city && country) {
    return `${city}, ${country}`;
  }
  
  return city || country || '';
}

/**
 * Format location for CSV export
 * @param location The location object to format
 * @returns Formatted location string for CSV (same as display but ensures safe CSV format)
 */
export function formatLocationForCSV(location: any): string {
  const formatted = formatLocationForDisplay(location);
  
  // Escape any commas or quotes that might break CSV format
  if (formatted.includes(',') || formatted.includes('"')) {
    return `"${formatted.replace(/"/g, '""')}"`;
  }
  
  return formatted;
}
