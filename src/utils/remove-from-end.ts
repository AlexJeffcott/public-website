/**
 * Removes a specified suffix from the end of a string.
 *
 * @param str The source string to process
 * @param suffix The suffix to remove
 * @returns A new string with the suffix removed if it exists, otherwise the original string
 */
export function removeFromEnd(str: string, suffix: string): string {
  if (!str || !suffix) {
    return str
  }

  return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
}
