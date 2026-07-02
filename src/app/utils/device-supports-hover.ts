/** Whether the primary input can hover (e.g. mouse), as opposed to touch-only. */
export function deviceSupportsHover(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}
