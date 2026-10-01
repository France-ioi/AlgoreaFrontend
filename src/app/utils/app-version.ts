export function readAppVersionFromDocument(doc: Document): string | null {
  const content = doc.querySelector('meta[name="app-version"]')?.getAttribute('content');
  if (content === null || content === undefined || content === '') return null;
  return content;
}

export function readAppVersionFromHtml(html: string): string | null {
  return readAppVersionFromDocument(new DOMParser().parseFromString(html, 'text/html'));
}
