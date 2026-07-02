import {
  narrowScreenMaxWidthCss,
  narrowScreenMaxWidthPx,
  narrowScreenMediaQuery,
} from './layout-breakpoints';

/** Mirror of $narrow-screen-max-width in src/assets/scss/breakpoints.scss — update both together. */
const scssNarrowScreenMaxWidth = '699.98px';

describe('layout-breakpoints', () => {
  it('uses a subpixel CSS width derived from the logical breakpoint', () => {
    expect(narrowScreenMaxWidthPx).toBe(700);
    expect(narrowScreenMaxWidthCss).toBe('699.98px');
    expect(narrowScreenMediaQuery).toBe('(max-width: 699.98px)');
  });

  it('exports the CSS width expected by breakpoints.scss', () => {
    expect(narrowScreenMaxWidthCss).toBe(scssNarrowScreenMaxWidth);
  });
});
