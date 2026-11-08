/**
 * BUTTERFLY — Public Asset URL Resolution Utility
 *
 * Automatically resolves public asset paths against Vite's base URL (import.meta.env.BASE_URL).
 * Guarantees 100% path compatibility whether deployed at root (/) or subpaths (e.g. /Butterfly/).
 */

export function assetUrl(path: string | undefined | null): string {
  if (!path) return '';

  // Return untouched if already a full URL, blob, or data URI
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  return `${cleanBase}${cleanPath}`;
}

