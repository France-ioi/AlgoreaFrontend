/** Author opt-in: break the iframe out of ancestor padding (see help panel). */
export const DESCRIPTION_EDGE_TO_EDGE_LAYOUT = 'edge-to-edge';

export interface ParsedDescriptionContent {
  bodyHtml: string,
  edgeToEdge: boolean,
}

function escapePlainDescriptionText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function documentRequestsEdgeToEdge(doc: Document): boolean {
  if (doc.body.querySelector('[data-alg-edge-to-edge]') !== null) return true;
  if (doc.body.querySelector(`[data-alg-layout="${DESCRIPTION_EDGE_TO_EDGE_LAYOUT}" i]`) !== null) {
    return true;
  }
  for (const el of doc.body.querySelectorAll('[data-alg-layout]')) {
    if (el.getAttribute('data-alg-layout')?.trim().toLowerCase() === DESCRIPTION_EDGE_TO_EDGE_LAYOUT) {
      return true;
    }
  }
  return false;
}

/** Single parse of author description HTML for body markup and edge-to-edge opt-in. */
export function parseDescriptionContent(raw: string): ParsedDescriptionContent {
  const trimmed = raw.trim();
  if (trimmed === '') return { bodyHtml: '', edgeToEdge: false };

  const doc = new DOMParser().parseFromString(raw, 'text/html');
  if (doc.body.childElementCount === 0) {
    return {
      bodyHtml: `<p>${escapePlainDescriptionText(raw)}</p>`,
      edgeToEdge: false,
    };
  }

  return {
    bodyHtml: raw,
    edgeToEdge: documentRequestsEdgeToEdge(doc),
  };
}
