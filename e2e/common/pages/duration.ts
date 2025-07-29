import { Page } from '@playwright/test';
import { expect } from 'e2e/common/fixture';

export class Duration {
  durationLocator = this.page.locator('alg-duration');
  dLocator = this.durationLocator.getByPlaceholder('DDD');
  hLocator = this.durationLocator.getByPlaceholder('HH');
  mLocator = this.durationLocator.getByPlaceholder('MM');
  sLocator = this.durationLocator.getByPlaceholder('SS');

  constructor(private page: Page) {
  }

  async fillD(input: string): Promise<void> {
    await expect.soft(this.dLocator).toBeVisible();
    await this.dLocator.fill(input);
  }

  async fillH(input: string): Promise<void> {
    await expect.soft(this.hLocator).toBeVisible();
    await this.hLocator.fill(input);
  }

  async fillM(input: string): Promise<void> {
    await expect.soft(this.mLocator).toBeVisible();
    await this.mLocator.fill(input);
  }

  async fillS(input: string): Promise<void> {
    await expect.soft(this.sLocator).toBeVisible();
    await this.sLocator.fill(input);
  }

  async checksIsDHasValue(value: string): Promise<void> {
    await expect.soft(this.dLocator).toHaveValue(value);
  }

  async checksIsHHasValue(value: string): Promise<void> {
    await expect.soft(this.hLocator).toHaveValue(value);
  }

  async checksIsMHasValue(value: string): Promise<void> {
    await expect.soft(this.mLocator).toHaveValue(value);
  }

  async checksIsSHasValue(value: string): Promise<void> {
    await expect.soft(this.sLocator).toHaveValue(value);
  }
}
