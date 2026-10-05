const CHUNK_LOADING_ERROR_MESSAGES = [
  'Loading chunk [a-z_\\d]+ failed', // older ?
  'Failed to fetch dynamically imported module', // chrome
  'error loading dynamically imported module', // firefox
  'Importing a module script failed', // safari
];

const CHUNK_LOADING_ERROR_PATTERN = new RegExp(
  CHUNK_LOADING_ERROR_MESSAGES.map(m => `(${m})`).join('|')
);

export function isChunkLoadingErrorMessage(message: string): boolean {
  return CHUNK_LOADING_ERROR_PATTERN.test(message);
}
