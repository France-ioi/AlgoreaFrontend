export function getDomain(href: string): string {
  const url = new URL(href);
  const origin = url.hostname;
  const hasSubdomain = origin.indexOf('.') !== origin.lastIndexOf('.');
  return hasSubdomain ? origin.slice(origin.indexOf('.') + 1) : origin;
}
