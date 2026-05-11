/**
 * Returns true if `fragment` parses to at least one HTML element child (i.e., is more than plain text).
 * Used to distinguish authored HTML from plain text for stored item descriptions and similar fields.
 */
export function containsHtmlElement(fragment: string): boolean {
  return new DOMParser().parseFromString(fragment, 'text/html').body.childElementCount > 0;
}
