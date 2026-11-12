export const PLATFORM_MIN_API_VERSION = 1;
export const PLATFORM_MAX_API_VERSION = 3;

export function negotiateApiVersion(taskMin = 1, taskMax = 1): number | null {
  const min = Math.max(taskMin, PLATFORM_MIN_API_VERSION);
  const max = Math.min(taskMax, PLATFORM_MAX_API_VERSION);
  return min <= max ? max : null;
}

/** True when the task owns work in progress (API ≥ 3 and metadata.savesHistory). */
export function savesEditorHistory(negotiatedApiVersion: number, savesHistory?: boolean): boolean {
  return negotiatedApiVersion >= 3 && savesHistory === true;
}

/** Negotiate API version onto the task and derive the saves-editor-history flag. Null if incompatible. */
export function withNegotiatedMetadata<T extends { apiVersion: number }>(
  task: T,
  metadata: { minApiVersion?: number, apiVersion?: number, usesTokens?: boolean, savesHistory?: boolean },
): { usesTokens: boolean, task: T, savesEditorHistory: boolean } | null {
  const negotiated = negotiateApiVersion(metadata.minApiVersion, metadata.apiVersion);
  if (negotiated === null) return null;
  task.apiVersion = negotiated;
  return {
    usesTokens: metadata.usesTokens ?? true,
    task,
    savesEditorHistory: savesEditorHistory(negotiated, metadata.savesHistory),
  };
}
