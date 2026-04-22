/**
 * Deterministic avatar generator.
 *
 * Given an opaque seed (e.g. a 64-bit user id encoded as a string), this module returns a stable
 * set of geometric parameters that the `UserAvatarComponent` template renders as inline SVG.
 */

export const AVATAR_SIZE = 36;

// Curated 12-color palette - mid-saturation hues spread around the wheel.
// IMPORTANT: order matters. The data generator pairs each entry's wrapper color with the *next*
// entry as the background (offset 13 mod 12 = 1, including wrap-around 11 -> 0), so adjacent
// entries must contrast either by luminance or by hue, otherwise the wrapper shape becomes invisible
// on top of its background. The current order alternates dark/light slots and uses complementary
// hues where the luminance gap shrinks.
// Kept as plain hex (no CSS variables) so contrast can be computed locally and outputs stay
// deterministic across themes.
const PALETTE = [
  '#405059', // slate (dark)
  '#EAB308', // amber (light)
  '#4F46E5', // indigo (dark)
  '#84CC16', // lime (light)
  '#0C8F8F', // deep cyan (dark)
  '#F97316', // orange (light)
  '#1E40AF', // deep blue (dark)
  '#F472B6', // pink (light)
  '#7C3AED', // violet (dark)
  '#22C55E', // green (mid-light)
  '#EF4444', // red (mid, complementary to surrounding green/teal)
  '#14B8A6', // teal (mid, complementary to surrounding red/slate-on-wrap)
];

export interface Avatar {
  wrapperColor: string,
  faceColor: string,
  backgroundColor: string,
  wrapperTranslateX: number,
  wrapperTranslateY: number,
  wrapperRotate: number,
  wrapperScale: number,
  isMouthOpen: boolean,
  isCircle: boolean,
  eyeSpread: number,
  mouthSpread: number,
  faceRotate: number,
  faceTranslateX: number,
  faceTranslateY: number,
}

/**
 * Pure: callers that render the same seed many times should memoize results via a bounded cache
 * (see `AvatarCacheService`) so the work is only done once per visible seed.
 */
export function generateAvatar(seed: string): Avatar {
  const num = hashCode(seed);
  const wrapperColor = pickColor(num);
  const preTranslateX = getUnit(num, 10, 1);
  // Nudge small translations away from zero so the wrapper does not visually align with
  // the background, producing more varied silhouettes across seeds.
  const wrapperTranslateX = preTranslateX < 5 ? preTranslateX + AVATAR_SIZE / 9 : preTranslateX;
  const preTranslateY = getUnit(num, 10, 2);
  const wrapperTranslateY = preTranslateY < 5 ? preTranslateY + AVATAR_SIZE / 9 : preTranslateY;

  const data: Avatar = {
    wrapperColor,
    faceColor: getContrast(wrapperColor),
    backgroundColor: pickColor(num + 13),
    wrapperTranslateX,
    wrapperTranslateY,
    wrapperRotate: getUnit(num, 360),
    wrapperScale: 1 + getUnit(num, AVATAR_SIZE / 12) / 10,
    isMouthOpen: getBoolean(num, 2),
    isCircle: getBoolean(num, 1),
    eyeSpread: getUnit(num, 5),
    mouthSpread: getUnit(num, 3),
    faceRotate: getUnit(num, 10, 3),
    faceTranslateX: wrapperTranslateX > AVATAR_SIZE / 6 ? wrapperTranslateX / 2 : getUnit(num, 8, 1),
    faceTranslateY: wrapperTranslateY > AVATAR_SIZE / 6 ? wrapperTranslateY / 2 : getUnit(num, 7, 2),
  };
  return data;
}

/** djb2-style 32-bit string hash, returned as a non-negative integer. */
function hashCode(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0;
  }
  return Math.abs(hash);
}

function getDigit(num: number, n: number): number {
  return Math.floor((num / Math.pow(10, n)) % 10);
}

/**
 * Pick a value in `[0, range)` from `num`. When an index is provided, the sign of the result is
 * controlled by the parity of the n-th decimal digit of `num` so we get both positive and negative
 * offsets without re-hashing.
 */
function getUnit(num: number, range: number, index = 0): number {
  const value = num % range;
  if (index && getDigit(num, index) % 2 === 0) return -value;
  return value;
}

function getBoolean(num: number, ratio: number): boolean {
  return getDigit(num, ratio) % 2 === 0;
}

function pickColor(num: number): string {
  return PALETTE[num % PALETTE.length] ?? PALETTE[0]!;
}

/**
 * YIQ-based contrast: returns a black or white hex that reads cleanly on top of the input color.
 * Threshold (128) is the conventional WCAG-friendly boundary.
 */
function getContrast(hex: string): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}
