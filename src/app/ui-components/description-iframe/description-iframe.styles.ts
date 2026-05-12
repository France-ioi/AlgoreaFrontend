/** Marker string asserted by unit tests to ensure base styles are embedded in srcdoc. */
export const DESCRIPTION_IFRAME_BASE_CSS_MARKER = 'alg-description-iframe-base-css';

/**
 * Default Algorea tokens and typography for sandboxed item descriptions.
 * Duplicates a subset of `src/variables.scss` and the theme overrides from `src/assets/scss/themes/*.scss`.
 * Body copy matches embedded `.html-container` inheritance (≈1rem, dark text), not `.alg-text-base`.
 *
 * The iframe is cross-origin (opaque), so parent stylesheets cannot reach inside; theme overrides must be
 * inlined here. The component sets `data-theme` on the inner `<html>` to mirror the active app theme.
 */
export const descriptionBaseCss = `
/* ${DESCRIPTION_IFRAME_BASE_CSS_MARKER} */
:root {
  --font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  --alg-primary-color: #0F61FF;
  --alg-primary-light-color: #dfe6f7;
  --alg-primary-dark-color: #012873;
  --alg-secondary-color: #616F82;
  --alg-accent-color: #fef0e6;
  --alg-accent-dark-color: #FF6600;
  --alg-black-color: #1D2227;
  --alg-white-color: #fff;
  --alg-light-color: #EEEEEE;
  --alg-border-color: #DEDEDE;
  --alg-border-light-color: rgba(0, 0, 0, .1);
  --alg-light-bg-color: #e8efff;
  --alg-light-text-color: #000;
  --alg-dark-text-color: #fff;
  --base-text-color: #787878;
  --dark-text-color: #4A4A4A;
  --alg-space-size-4: 1.5rem;
  --alg-space-size-5: 1rem;
  --border-radius: .5rem;
  /* Default reading measure (920px); authors may override in description CSS. */
  --description-reading-max-width: 57.5rem;
  /* Replaces former outer content top padding when Content is flush under tabs; set to 0 in description CSS to remove. */
  --description-content-padding-top: var(--alg-space-size-4);
}

/* Theme overrides — keep in sync with src/assets/scss/themes/*.scss. */
[data-theme=thymio] {
  --font-family: "Poppins", sans-serif;
  --alg-primary-color: #452AB6;
}

[data-theme=probabl] {
  --font-family: "Geist", "Roboto", sans-serif;
  --alg-primary-color: #1E22AA;
}

[data-theme=coursera-pt] {
  --font-family: "Source Sans Pro", Arial, sans-serif;
  --alg-primary-color: #0056D2;
  --alg-primary-dark-color: #053B89;
}

*, *::before, *::after {
  box-sizing: border-box;
}

/* Parent owns the height (driven by alg.updateDisplay messages); the iframe itself never scrolls. */
html, body {
  overflow: hidden;
}

body {
  margin: 0;
  padding: var(--description-content-padding-top) 0 0;
  font-family: var(--font-family);
  color: var(--alg-light-text-color);
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.5rem;
  white-space: normal;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0 0 var(--alg-space-size-5) 0;
  font-weight: 500;
  color: inherit;
  line-height: 1.3;
  max-width: var(--description-reading-max-width);
}

h1 { font-size: 3rem; }
h2 { font-size: 2.5rem; }
h3 { font-size: 2rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1.125rem; }

p {
  margin: var(--alg-space-size-5) 0;
  max-width: var(--description-reading-max-width);
}

p:first-child {
  margin-top: 0;
}

a {
  color: var(--alg-primary-color);
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  text-decoration: underline;
}

ul, ol {
  margin: 0 0 var(--alg-space-size-5) 0;
  padding-left: 1.5rem;
  max-width: var(--description-reading-max-width);
}

img {
  max-width: 100%;
  height: auto;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.9em;
  padding: 0 .2rem;
  border: .1rem solid var(--alg-border-light-color);
  border-radius: .3rem;
  background-color: rgba(0, 0, 0, .05);
}

pre {
  margin: 0 0 var(--alg-space-size-5) 0;
  padding: .75rem 1rem;
  overflow: auto;
  max-width: var(--description-reading-max-width);
  border: .1rem solid var(--alg-border-light-color);
  border-radius: var(--border-radius);
  background-color: rgba(0, 0, 0, .05);
  font-size: 0.9rem;
  line-height: 1.45;
}

pre code {
  padding: 0;
  border: none;
  background: none;
}

blockquote {
  margin: 0 0 var(--alg-space-size-5) 0;
  padding-left: var(--alg-space-size-4);
  border-left: .25rem solid var(--alg-border-color);
  color: var(--base-text-color);
  max-width: var(--description-reading-max-width);
}

table {
  width: 100%;
  max-width: 100%;
  margin: 0 0 var(--alg-space-size-5) 0;
  border-collapse: collapse;
}

th, td {
  padding: .5rem .75rem;
  border: .0625rem solid var(--alg-border-color);
  text-align: left;
}
`;
