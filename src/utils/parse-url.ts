/**
 * Parses URL hash and query parameters
 * @param href - The URL to parse (defaults to current location)
 * @returns Object containing hash and params
 */
export function parseUrl(href: string) {
  // Extract hash
  const hashMatch = href.match(/#([^?]*)/)
  const hash = hashMatch ? hashMatch[1] : ''

  // Extract query parameters from both main URL and after hash
  const url = new URL(href)
  const params = new Map<string, string>()

  // Process main query params
  url.searchParams.forEach((value, key) => {
    params.set(key, value)
  })

  // Process hash query params if they exist
  const hashQueryMatch = href.match(/#[^?]*(?:\?(.*))/)
  if (hashQueryMatch && hashQueryMatch[1]) {
    const hashParams = new URLSearchParams(hashQueryMatch[1])
    hashParams.forEach((value, key) => {
      params.set(key, value)
    })
  }

  return {
    hash,
    params,
  }
}

/**
 * Type definition for the return value of parseUrl
 */
export type UrlParts = {
  hash: string
  params: Map<string, string>
}
