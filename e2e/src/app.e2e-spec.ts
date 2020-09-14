import {AppPage} from './app.po';
import {browser, by, logging} from 'protractor';

describe('workspace-project App', () => {
  let page: AppPage; // eslint-disable-line @typescript-eslint/no-unused-vars

  beforeEach(() => {
    page = new AppPage();
  });

  it('check the heading title', () => {
    void page.navigateTo();
    void expect(
      page.getHeadingElement().getText()).toEqual('ALGOREA PLATFORM');
  });

  it('check the first element of the activity tree', () => {
    void page.navigateTo();
    void expect(
      page
        .getFirstPokemonCardElement()
        .element(by.css('.node-label-title'))
        .getText()
    ).toContain('Activités publiques');
  });

  it('check the number of elements in the activity tree', () => {
    void page.navigateTo();
    void expect(page.getActivitiesElements().count()).toBe(1);
  });

  it('check the number of elements in the activity tree after a click', () => {
    void page.navigateTo();
    void page.getFirstPokemonCardElement().click();

    void expect(page.getActivitiesElements().count()).toBe(42);
  });

  it('check the item-detail', () => {
    void page.navigateTo();
    void page.getFirstPokemonCardElement().click();

    void expect(page.getMainContentElement()).toBeTruthy();
    void expect(page.getMainContentElement().getText()).toEqual('item-details works!');
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
