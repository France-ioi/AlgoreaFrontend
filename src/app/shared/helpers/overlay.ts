export const canCloseOverlay = (event: MouseEvent): boolean => {
  const target = event.target;
  const relatedTarget = event.relatedTarget;
  return (target instanceof HTMLElement &&
    relatedTarget instanceof HTMLElement &&
    !relatedTarget.closest('.alg-path-suggestion-overlay'));
};
