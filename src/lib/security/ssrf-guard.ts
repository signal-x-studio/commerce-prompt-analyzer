/**
 * SSRF (Server-Side Request Forgery) Protection
 *
 * Validates URLs to prevent requests to internal networks, cloud metadata endpoints,
 * and other potentially dangerous destinations.
 */

// Private/internal IP address patterns
const PRIVATE_IP_PATTERNS = [
  // IPv4 private ranges
  /^127\./, // Loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^169\.254\./, // Link-local
  /^0\./, // Current network

  // IPv6
  /^::1$/, // Loopback
  /^fe80:/i, // Link-local
  /^fc00:/i, // Unique local
  /^fd00:/i, // Unique local
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::]",
  "[::1]",
  "metadata.google.internal", // GCP metadata
  "169.254.169.254", // AWS/GCP/Azure metadata
  "metadata.google", // GCP metadata alternate
];

// Blocked TLD/suffixes
const BLOCKED_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".corp",
  ".lan",
  ".home",
  ".intranet",
];

// Allowed protocols
const ALLOWED_PROTOCOLS = ["http:", "https:"];

export interface SSRFValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates a URL for SSRF vulnerabilities
 *
 * @param urlString - The URL to validate
 * @returns Validation result with error message if invalid
 */
export function validateUrlForSSRF(urlString: string): SSRFValidationResult {
  // Basic validation
  if (!urlString || typeof urlString !== "string") {
    return { valid: false, error: "URL is required" };
  }

  // Trim and check length
  const trimmedUrl = urlString.trim();
  if (trimmedUrl.length > 2048) {
    return { valid: false, error: "URL exceeds maximum length (2048 chars)" };
  }

  // Parse URL
  let url: URL;
  try {
    url = new URL(trimmedUrl);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return {
      valid: false,
      error: `Invalid protocol: ${url.protocol}. Only HTTP/HTTPS allowed.`,
    };
  }

  // Get hostname (lowercase for comparison)
  const hostname = url.hostname.toLowerCase();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return {
      valid: false,
      error: "URL points to blocked hostname",
    };
  }

  // Check blocked suffixes
  for (const suffix of BLOCKED_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return {
        valid: false,
        error: `URL hostname has blocked suffix: ${suffix}`,
      };
    }
  }

  // Check private IP patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        valid: false,
        error: "URL points to private/internal IP address",
      };
    }
  }

  // Check for IP address in hostname (additional validation)
  if (isIPAddress(hostname)) {
    const isPrivate = isPrivateIPAddress(hostname);
    if (isPrivate) {
      return {
        valid: false,
        error: "URL points to private IP address",
      };
    }
  }

  // Check for port-based attacks (uncommon ports)
  const port = url.port ? parseInt(url.port, 10) : getDefaultPort(url.protocol);
  if (port && !isAllowedPort(port)) {
    return {
      valid: false,
      error: `Port ${port} is not allowed`,
    };
  }

  // Check for credential leakage in URL
  if (url.username || url.password) {
    return {
      valid: false,
      error: "URLs with credentials are not allowed",
    };
  }

  return {
    valid: true,
    normalizedUrl: url.toString(),
  };
}

/**
 * Check if a string is an IP address
 */
function isIPAddress(str: string): boolean {
  // IPv4
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 (simplified check)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Pattern.test(str) || ipv6Pattern.test(str);
}

/**
 * Check if an IP address is private
 */
function isPrivateIPAddress(ip: string): boolean {
  // Check against private IP patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(ip)) {
      return true;
    }
  }

  // Additional IPv4 range checks
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // Loopback: 127.0.0.0/8
    if (parts[0] === 127) return true;
    // Link-local: 169.254.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;
    // Private: 10.0.0.0/8
    if (parts[0] === 10) return true;
    // Private: 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // Private: 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // Current network: 0.0.0.0/8
    if (parts[0] === 0) return true;
    // Broadcast
    if (parts.every((p) => p === 255)) return true;
  }

  return false;
}

/**
 * Get default port for a protocol
 */
function getDefaultPort(protocol: string): number | null {
  switch (protocol) {
    case "http:":
      return 80;
    case "https:":
      return 443;
    default:
      return null;
  }
}

/**
 * Check if a port is allowed
 */
function isAllowedPort(port: number): boolean {
  // Allow standard web ports
  const allowedPorts = [80, 443, 8080, 8443, 3000, 5000];
  return allowedPorts.includes(port);
}

/**
 * Sanitize a URL for safe embedding in prompts
 * Removes query parameters and fragments that might contain sensitive data
 */
export function sanitizeUrlForPrompt(urlString: string): string {
  try {
    const url = new URL(urlString);
    // Return only origin + pathname (no query string or hash)
    return `${url.origin}${url.pathname}`;
  } catch {
    // If URL parsing fails, return a safe placeholder
    return "[invalid-url]";
  }
}

/**
 * Extract domain from URL for comparison
 */
export function extractDomain(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check if two URLs have the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = extractDomain(url1);
  const domain2 = extractDomain(url2);
  return domain1 !== null && domain1 === domain2;
}
