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
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const basePrefix = cleanBase.startsWith('/') ? cleanBase : `/${cleanBase}`;

  // If path already starts with the base URL (e.g. /Butterfly/ or Butterfly/), do NOT prepend it again
  if (path.startsWith(basePrefix)) {
    return path;
  }

  const baseWithoutSlash = basePrefix.replace(/^\/+|\/+$/g, '');
  if (baseWithoutSlash && path.startsWith(baseWithoutSlash + '/')) {
    return `/${path}`;
  }
  if (baseWithoutSlash && path.startsWith('/' + baseWithoutSlash + '/')) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

