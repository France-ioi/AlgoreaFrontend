import {
  contentViewPropagationDisplay,
  ContentViewPropagationIconPipe,
  ContentViewPropagationLabelPipe,
} from './content-view-propagation-display';

describe('contentViewPropagationDisplay', () => {
  describe('regular children', () => {
    it('maps none to Locked and hidden', () => {
      expect(contentViewPropagationDisplay('none', false)).toEqual({
        label: 'Locked and hidden',
        icon: 'ph-duotone ph-eye-slash',
      });
    });

    it('maps as_info to Locked', () => {
      expect(contentViewPropagationDisplay('as_info', false)).toEqual({
        label: 'Locked',
        icon: 'ph-duotone ph-lock-simple',
      });
    });

    it('maps as_content to Open', () => {
      expect(contentViewPropagationDisplay('as_content', false)).toEqual({
        label: 'Open',
        icon: 'ph-duotone ph-eye',
      });
    });
  });

  describe('explicit-entry children', () => {
    it('maps none to Hidden', () => {
      expect(contentViewPropagationDisplay('none', true)).toEqual({
        label: 'Hidden',
        icon: 'ph-duotone ph-eye-slash',
      });
    });

    it('maps as_info to View entry page', () => {
      expect(contentViewPropagationDisplay('as_info', true)).toEqual({
        label: 'View entry page',
        icon: 'ph-duotone ph-door',
      });
    });

    it('maps as_content to Free entry', () => {
      expect(contentViewPropagationDisplay('as_content', true)).toEqual({
        label: 'Free entry',
        icon: 'ph-duotone ph-door-open',
      });
    });
  });
});

describe('ContentViewPropagationIconPipe', () => {
  const pipe = new ContentViewPropagationIconPipe();

  it('returns the icon for a known value', () => {
    expect(pipe.transform('as_info', false)).toBe('ph-duotone ph-lock-simple');
    expect(pipe.transform('as_info', true)).toBe('ph-duotone ph-door');
  });

  it('returns an empty string for undefined', () => {
    expect(pipe.transform(undefined, false)).toBe('');
  });
});

describe('ContentViewPropagationLabelPipe', () => {
  const pipe = new ContentViewPropagationLabelPipe();

  it('returns the label for a known value', () => {
    expect(pipe.transform('as_content', false)).toBe('Open');
    expect(pipe.transform('as_content', true)).toBe('Free entry');
  });

  it('returns an empty string for undefined', () => {
    expect(pipe.transform(undefined, false)).toBe('');
  });
});
