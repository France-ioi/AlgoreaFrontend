/** Logical narrow/mobile breakpoint (~700px). Product-facing name for docs and tests. */
export const narrowScreenMaxWidthPx = 700;

/**
 * CSS max-width with a subpixel offset to avoid flicker when resizing at the boundary.
 * Must match $narrow-screen-max-width in src/assets/scss/breakpoints.scss.
 */
export const narrowScreenMaxWidthCss = `${narrowScreenMaxWidthPx - 0.02}px`;

export const narrowScreenMediaQuery = `(max-width: ${narrowScreenMaxWidthCss})`;
