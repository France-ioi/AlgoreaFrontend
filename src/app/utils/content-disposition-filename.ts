/**
 * Parse a download filename from a `Content-Disposition` response header.
 *
 * Supports `filename*=UTF-8''…`, quoted `filename="…"`, and unquoted `filename=…` forms.
 * Returns a fallback of `groups_progress_with_answers_for_group-{groupId}.zip` when the header is
 * missing or contains no recognizable filename.
 */
export function getContentDispositionFilename(contentDisposition: string | null, groupId: string): string {
  const fallback = `groups_progress_with_answers_for_group-${groupId}.zip`;
  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = /filename\*=UTF-8''([^;\n]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(contentDisposition);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const unquotedMatch = /filename=([^;\n]+)/i.exec(contentDisposition);
  if (unquotedMatch?.[1]) {
    return unquotedMatch[1].trim();
  }

  return fallback;
}
