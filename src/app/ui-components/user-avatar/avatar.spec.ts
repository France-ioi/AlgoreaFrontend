import { Avatar, generateAvatar, getContrast, PALETTE } from './avatar';

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

// WCAG 2.x relative luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG 2.x contrast ratio: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
function wcagContrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const [ light, dark ] = lA >= lB ? [ lA, lB ] : [ lB, lA ];
  return (light + 0.05) / (dark + 0.05);
}

function hueDegrees(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;
  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  return ((h * 60) + 360) % 360;
}

function hueDistance(hexA: string, hexB: string): number {
  const diff = Math.abs(hueDegrees(hexA) - hueDegrees(hexB));
  return Math.min(diff, 360 - diff);
}

const NUMERIC_FIELDS: (keyof Avatar)[] = [
  'wrapperTranslateX',
  'wrapperTranslateY',
  'wrapperRotate',
  'wrapperScale',
  'eyeSpread',
  'mouthSpread',
  'faceRotate',
  'faceTranslateX',
  'faceTranslateY',
];

describe('avatar', () => {
  describe('generateAvatar', () => {
    it('should be deterministic for the same seed', () => {
      expect(generateAvatar('seed')).toEqual(generateAvatar('seed'));
    });

    it('should produce different avatars for a handful of distinct seeds', () => {
      const seeds = [ 'a', 'b', 'c', 'user-1', 'user-2', '12345' ];
      const avatars = seeds.map(s => generateAvatar(s));
      const fingerprints = new Set(avatars.map(a => `${a.wrapperColor}|${a.wrapperRotate}|${a.faceTranslateX}|${a.faceTranslateY}`));
      // Hash collisions on this tiny seed set would point at a real regression in `hashCode`.
      expect(fingerprints.size).toBe(seeds.length);
    });

    it('should return a stable, fully-finite avatar for the empty seed', () => {
      const a = generateAvatar('');
      const b = generateAvatar('');
      expect(a).toEqual(b);
      for (const field of NUMERIC_FIELDS) {
        expect(Number.isFinite(a[field] as number))
          .withContext(`field ${field} must be finite, got ${String(a[field])}`)
          .toBe(true);
      }
      expect(a.wrapperColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(a.faceColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(a.backgroundColor).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('getContrast', () => {
    it('should return black on white', () => {
      expect(getContrast('#FFFFFF')).toBe('#000000');
    });

    it('should return white on black', () => {
      expect(getContrast('#000000')).toBe('#FFFFFF');
    });
  });

  describe('PALETTE contract', () => {
    // The comment in avatar.ts promises ≥ 3:1 contrast (WCAG AA minimum for non-text UI components)
    // between every wrapper color and the face/eyes/mouth color picked by `getContrast`.
    it('should yield ≥ 3:1 WCAG contrast between every wrapper color and its face color', () => {
      for (const wrapperColor of PALETTE) {
        const faceColor = getContrast(wrapperColor);
        const ratio = wcagContrastRatio(wrapperColor, faceColor);
        expect(ratio)
          .withContext(`wrapper ${wrapperColor} vs face ${faceColor} (ratio=${ratio.toFixed(2)})`)
          .toBeGreaterThanOrEqual(3);
      }
    });

    // The "order matters" comment promises adjacent entries differ visibly — by luminance, by hue,
    // or by both. We assert the weaker of those two for every pair so the test mirrors the contract
    // exactly: a future palette tweak that breaks both axes (e.g. two near-identical mid-tones
    // placed side by side) will fail here.
    it('should keep adjacent palette entries visibly distinct (luminance ≥ 3 OR hue ≥ 60°)', () => {
      for (let i = 0; i < PALETTE.length; i++) {
        const a = PALETTE[i] as string;
        const b = PALETTE[(i + 1) % PALETTE.length] as string;
        const lum = wcagContrastRatio(a, b);
        const hue = hueDistance(a, b);
        const ok = lum >= 3 || hue >= 60;
        expect(ok)
          .withContext(`pair ${a} → ${b}: luminance ratio=${lum.toFixed(2)}, hue distance=${hue.toFixed(1)}°`)
          .toBe(true);
      }
    });
  });
});
