/**
 * Safely encodes a string for use as a URL parameter.
 * This handles special characters and ensures proper URL encoding.
 *
 * @param value - The string to encode
 * @returns The encoded string safe for use in URLs
 */
export function encodeStringForUrl(value: string): string {
  // Use encodeURIComponent for basic encoding
  // Then additionally encode characters that encodeURIComponent doesn't handle
  return encodeURIComponent(value)
    .replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    )
}
