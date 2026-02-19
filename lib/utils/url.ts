/**
 * Utility functions for URL handling
 * Ensures consistent base URL usage across the application
 */

/**
 * Get the base URL for the application
 * Priority:
 * 1. NEXT_PUBLIC_BASE_URL environment variable (for production deployment)
 * 2. NEXT_PUBLIC_FRONTEND_URL environment variable (fallback)
 * 3. window.location.origin (for browser/client-side)
 * 4. Empty string (for relative URLs)
 */
export function getBaseUrl(): string {
  // Server-side: use environment variable or empty string
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      ""
    )
  }

  // Client-side: use environment variable or window.location.origin
  const envBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    window.location.origin

  // Remove trailing slash if present
  return envBaseUrl.replace(/\/$/, "")
}

/**
 * Generate a full URL for asset verification
 * @param assetId - The asset ID
 * @param assetCode - The asset code (optional, for verification)
 * @returns Full URL to the asset verification page
 */
export function generateAssetVerificationUrl(
  assetId: number | string,
  assetCode?: string
): string {
  const baseUrl = getBaseUrl()
  const path = `/assets/verify/${assetId}`
  const params = assetCode ? `?code=${encodeURIComponent(assetCode)}` : ""
  return `${baseUrl}${path}${params}`
}
