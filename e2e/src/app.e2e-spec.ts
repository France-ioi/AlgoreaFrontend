/* eslint-disable @typescript-eslint/no-floating-promises */

import {AppPage} from './app.po';
import {browser, by, logging} from 'protractor';

describe('workspace-project App', () => {
  let page: AppPage; // eslint-disable-line @typescript-eslint/no-unused-vars

  beforeEach(() => {
    page = new AppPage();
  });

  it('check the heading title', () => {
    page.navigateTo();
    expect(
      page.getHeadingElement().getText()).toEqual('ALGOREA PLATFORM');
  });

  it('check the first element of the activity tree', () => {
    page.navigateTo();
    expect(
      page
        .getFirstPokemonCardElement()
        .element(by.css('.node-label-title'))
        .getText()
    ).toContain('Activités publiques');
  });

  it('check the number of elements in the activity tree', () => {
    page.navigateTo();
    expect(page.getActivitiesElements().count()).toBe(1);
  });

  it('check the number of elements in the activity tree after a click', () => {
    page.navigateTo();
    page.getFirstPokemonCardElement().click();

    expect(page.getActivitiesElements().count()).toBe(42);
  });

  it('check the item-detail', () => {
    // Check if the first item exists and is working
    page.navigateTo();
    page.getFirstPokemonCardElement().click();

    expect(page.getMainContentElement()).toBeTruthy();
    expect(page.getMainContentElement().getText()).toEqual('item-details works!');
  });

  it('check the collapse button behavior', () => {
    page.navigateTo();

    expect(page.getLeftElement().getAttribute('class')).toMatch('expanded');
    expect(page.getTopBarElement().getAttribute('class')).toMatch('expanded');
    expect(page.getRightElement().getAttribute('class')).toMatch('expanded');

    page.getCollapseButtonElement().click();

    expect(page.getLeftElement().getAttribute('class')).toMatch('collapsed');
    expect(page.getTopBarElement().getAttribute('class')).toMatch('collapsed');
    expect(page.getRightElement().getAttribute('class')).toMatch('collapsed');
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
