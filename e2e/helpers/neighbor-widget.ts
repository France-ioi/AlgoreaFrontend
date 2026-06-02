import { expect, Locator } from '@playwright/test';

export function neighborWidgetLocator(root: { locator: (selector: string) => Locator }): Locator {
  return root.locator('alg-neighbor-widget');
}

export function neighborBackButton(widget: Locator): Locator {
  return widget.locator('button.neighbor-nav').first();
}

export function neighborNextButton(widget: Locator): Locator {
  return widget.getByTestId('nav-to-next');
}

export function neighborPrevButton(widget: Locator): Locator {
  return widget.locator('button.nav-arrow');
}

async function expectCaptionVisible(button: Locator): Promise<void> {
  await expect(button.locator('.content')).toBeVisible();
}

async function expectCaptionCollapsed(button: Locator): Promise<void> {
  await expect(button.locator('.content')).toHaveCount(0);
}

/** Back only, with the primary caption/background (not collapsed to icon-only). */
export async function expectBackOnlyExpanded(widget: Locator): Promise<void> {
  const back = neighborBackButton(widget);
  await expect(back).toBeVisible();
  await expectCaptionVisible(back);
  await expect(neighborNextButton(widget)).toHaveCount(0);
  await expect(neighborPrevButton(widget)).toHaveCount(0);
}

/** Back, previous, and next controls visible; next shows its caption when enabled. */
export async function expectPrevNextNav(
  widget: Locator,
  options: { nextHighlighted: boolean },
): Promise<void> {
  await expect(neighborBackButton(widget)).toBeVisible();
  await expect(neighborPrevButton(widget)).toBeVisible();
  const next = neighborNextButton(widget);
  await expect(next).toBeVisible();

  if (options.nextHighlighted) {
    await expectCaptionVisible(next);
    await expectCaptionCollapsed(neighborBackButton(widget));
  }
}
