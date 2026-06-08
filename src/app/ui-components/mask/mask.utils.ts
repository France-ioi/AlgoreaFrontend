export type MaskMode = 'numeric' | 'template';

export interface ParsedMask {
  mode: MaskMode,
  maxDigits: number,
  template: string,
}

const DIGIT_SLOT = /^[09]$/;

export const countDigitSlots = (pattern: string): number => {
  let count = 0;
  for (const char of pattern) {
    if (DIGIT_SLOT.test(char)) {
      count += 1;
    }
  }
  return count;
};

export const parseMaskPattern = (pattern: string): ParsedMask => {
  if (pattern.includes('||')) {
    const segments = pattern.split('||');
    const maxDigits = Math.max(...segments.map(segment => countDigitSlots(segment)));
    return { mode: 'numeric', maxDigits, template: '' };
  }

  const hasLiterals = [ ...pattern ].some(char => !DIGIT_SLOT.test(char) && char !== '*');
  if (hasLiterals) {
    return { mode: 'template', maxDigits: countDigitSlots(pattern), template: pattern };
  }

  if (pattern.endsWith('*')) {
    return { mode: 'numeric', maxDigits: Number.POSITIVE_INFINITY, template: '' };
  }

  return { mode: 'numeric', maxDigits: countDigitSlots(pattern), template: '' };
};

export const extractDigits = (value: string): string => value.replace(/\D/g, '');

export const applyTemplateMask = (value: string, template: string): string => {
  const digits = extractDigits(value);
  let result = '';
  let digitIndex = 0;

  for (const char of template) {
    if (DIGIT_SLOT.test(char)) {
      if (digitIndex < digits.length) {
        result += digits[digitIndex];
        digitIndex += 1;
      } else {
        break;
      }
    } else if (digitIndex > 0) {
      result += char;
    }
  }

  return result;
};

export const applyNumericMask = (value: string, maxDigits: number): string => {
  let digits = extractDigits(value);
  if (Number.isFinite(maxDigits)) {
    digits = digits.slice(0, maxDigits);
  }
  return digits;
};

export const formatMaskValue = (value: string, parsed: ParsedMask): string => {
  if (parsed.mode === 'template') {
    return applyTemplateMask(value, parsed.template);
  }
  return applyNumericMask(value, parsed.maxDigits);
};

export const countDigitsBeforeIndex = (value: string, index: number): number => {
  let count = 0;
  const end = Math.min(index, value.length);
  for (let i = 0; i < end; i += 1) {
    if (/\d/.test(value.charAt(i))) {
      count += 1;
    }
  }
  return count;
};

export const selectionIndexAfterDigits = (formattedValue: string, digitCount: number): number => {
  if (digitCount <= 0) {
    return 0;
  }

  let digitsSeen = 0;
  for (let i = 0; i < formattedValue.length; i += 1) {
    if (/\d/.test(formattedValue.charAt(i))) {
      digitsSeen += 1;
      if (digitsSeen >= digitCount) {
        return i + 1;
      }
    }
  }

  return formattedValue.length;
};
