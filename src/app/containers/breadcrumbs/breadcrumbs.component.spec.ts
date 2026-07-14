import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';
import { ContentBreadcrumb } from 'src/app/models/content/content-breadcrumbs';

import { BreadcrumbsComponent } from './breadcrumbs.component';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';

class MockResizeObserver {
  static callback: (() => void) | null = null;

  constructor(callback: () => void) {
    MockResizeObserver.callback = callback;
  }

  observe = jasmine.createSpy('observe');
  unobserve = jasmine.createSpy('unobserve');
  disconnect = jasmine.createSpy('disconnect');
}

function mockListFitsContainer(fixture: ComponentFixture<BreadcrumbsComponent>): void {
  const container = fixture.debugElement.query(By.css('.breadcrumb-container')).nativeElement as HTMLElement;
  const list = fixture.debugElement.query(By.css('.breadcrumb-list')).nativeElement as HTMLElement;
  Object.defineProperty(list, 'scrollWidth', {
    configurable: true,
    get: (): number => container.clientWidth,
  });
}

function triggerResize(fixture: ComponentFixture<BreadcrumbsComponent>): void {
  MockResizeObserver.callback?.();
  (fixture.componentInstance as unknown as { updateCollapsedCount(): void }).updateCollapsedCount();
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
}

function setContainerWidth(fixture: ComponentFixture<BreadcrumbsComponent>, width: number): void {
  const container = fixture.debugElement.query(By.css('.breadcrumb-container')).nativeElement as HTMLElement;
  Object.defineProperty(container, 'clientWidth', { configurable: true, value: width });
}

function setMeasureWidths(fixture: ComponentFixture<BreadcrumbsComponent>, itemWidths: number[]): void {
  const measureItems = fixture.debugElement.queryAll(By.css('.breadcrumb-measure-list .measure-item'));
  measureItems.forEach((item, index) => {
    Object.defineProperty(item.nativeElement, 'offsetWidth', { configurable: true, value: itemWidths[index] ?? 0 });
  });

  const separator = fixture.debugElement.query(By.css('.breadcrumb-measure-list .measure-separator'));
  if (separator !== null) {
    Object.defineProperty(separator.nativeElement, 'offsetWidth', { configurable: true, value: 20 });
  }

  const ellipsis = fixture.debugElement.query(By.css('.breadcrumb-measure-list .measure-ellipsis'));
  if (ellipsis !== null) {
    Object.defineProperty(ellipsis.nativeElement, 'offsetWidth', { configurable: true, value: 16 });
  }
}

describe('BreadcrumbsComponent', () => {
  let resizeObserverBackup: typeof ResizeObserver;

  beforeAll(() => {
    resizeObserverBackup = window.ResizeObserver;
    (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterAll(() => {
    (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = resizeObserverBackup;
  });

  afterEach(() => {
    MockResizeObserver.callback = null;
  });

  describe('with a last breadcrumb icon', () => {
    let fixture: ComponentFixture<BreadcrumbsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ BreadcrumbsComponent ],
        providers: [
          provideMockStore({
            selectors: [
              {
                selector: fromCurrentContent.selectBreadcrumbs,
                value: [
                  { title: 'Parent chapter', navigateTo: (): void => {} },
                  { title: 'Current task', icon: 'ph-file-text' },
                ],
              },
              { selector: fromCurrentContent.selectTitle, value: undefined },
            ],
          }),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BreadcrumbsComponent);
      fixture.detectChanges();
    });

    it('should render text for intermediate breadcrumbs', () => {
      const labels = fixture.debugElement.queryAll(By.css('.breadcrumb-list .breadcrumb-item .label'));
      expect(labels.length).toBe(1);
      expect(labels[0]!.nativeElement.textContent).toBe('Parent chapter');
    });

    it('should render only the icon for the last breadcrumb when an icon is provided', () => {
      const icon = fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active .breadcrumb-icon'));
      const hiddenTitle = fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active .visually-hidden'));

      expect(icon).toBeTruthy();
      expect(icon.nativeElement.classList.contains('ph-file-text')).toBeTrue();
      expect(hiddenTitle.nativeElement.textContent).toBe('Current task');
      expect(fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active .label'))).toBeNull();
    });
  });

  describe('with an icon on a non-last breadcrumb', () => {
    let fixture: ComponentFixture<BreadcrumbsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ BreadcrumbsComponent ],
        providers: [
          provideMockStore({
            selectors: [
              {
                selector: fromCurrentContent.selectBreadcrumbs,
                value: [
                  { title: 'Parent with icon', icon: 'ph-folder-simple', navigateTo: (): void => {} },
                  { title: 'Current task', icon: 'ph-file-text' },
                ],
              },
              { selector: fromCurrentContent.selectTitle, value: undefined },
            ],
          }),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BreadcrumbsComponent);
      fixture.detectChanges();
    });

    it('should still render text for intermediate breadcrumbs', () => {
      const parentItem = fixture.debugElement.queryAll(By.css('.breadcrumb-list .breadcrumb-item'))[0]!;
      const parentLabel = parentItem.query(By.css('.label'));

      expect(parentLabel.nativeElement.textContent).toBe('Parent with icon');
      expect(parentItem.query(By.css('.breadcrumb-icon'))).toBeNull();
    });
  });

  describe('smart compression', () => {
    const breadcrumbs: ContentBreadcrumb[] = [
      { title: 'Root chapter', navigateTo: jasmine.createSpy('navigateRoot') },
      { title: 'Middle chapter', navigateTo: jasmine.createSpy('navigateMiddle') },
      { title: 'Current task', icon: 'ph-file-text' },
    ];

    let fixture: ComponentFixture<BreadcrumbsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ BreadcrumbsComponent ],
        providers: [
          provideMockStore({
            selectors: [
              { selector: fromCurrentContent.selectBreadcrumbs, value: breadcrumbs },
              { selector: fromCurrentContent.selectTitle, value: undefined },
            ],
          }),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BreadcrumbsComponent);
      fixture.detectChanges();
    });

    beforeEach(() => {
      (breadcrumbs[0]!.navigateTo as jasmine.Spy).calls.reset();
      (breadcrumbs[1]!.navigateTo as jasmine.Spy).calls.reset();
    });

    it('should not collapse breadcrumbs when there is enough space', () => {
      setContainerWidth(fixture, 500);
      setMeasureWidths(fixture, [ 120, 140, 32 ]);
      triggerResize(fixture);

      expect(fixture.debugElement.query(By.css('.breadcrumb-list .collapsed-trigger'))).toBeNull();
      const labels = fixture.debugElement.queryAll(By.css('.breadcrumb-list .breadcrumb-item .label'));
      expect(labels.map(label => label.nativeElement.textContent)).toEqual([ 'Root chapter', 'Middle chapter' ]);
    });

    it('should collapse leading breadcrumbs from the front when space is limited', () => {
      setContainerWidth(fixture, 300);
      setMeasureWidths(fixture, [ 120, 140, 32 ]);
      triggerResize(fixture);

      expect(fixture.debugElement.query(By.css('.breadcrumb-list .collapsed-trigger'))).toBeTruthy();
      const labels = fixture.debugElement.queryAll(By.css('.breadcrumb-list .breadcrumb-item .label'));
      expect(labels.map(label => label.nativeElement.textContent)).toEqual([ 'Middle chapter' ]);
    });

    it('should list only collapsed breadcrumbs in the menu', () => {
      setContainerWidth(fixture, 300);
      setMeasureWidths(fixture, [ 120, 140, 32 ]);
      triggerResize(fixture);

      fixture.debugElement.query(By.css('.breadcrumb-list .collapsed-trigger')).nativeElement.click();
      fixture.detectChanges();

      const menuItems = fixture.debugElement.queryAll(By.css('.collapsed-breadcrumbs-menu-item'));
      expect(menuItems.map(item => item.nativeElement.textContent.trim())).toEqual([ 'Root chapter' ]);
    });

    it('should navigate when a collapsed breadcrumb menu item is clicked', () => {
      setContainerWidth(fixture, 300);
      setMeasureWidths(fixture, [ 120, 140, 32 ]);
      triggerResize(fixture);

      fixture.debugElement.query(By.css('.breadcrumb-list .collapsed-trigger')).nativeElement.click();
      fixture.detectChanges();

      fixture.debugElement.query(By.css('.collapsed-breadcrumbs-menu-item')).nativeElement.click();
      expect(breadcrumbs[0]!.navigateTo).toHaveBeenCalled();
    });

    it('should keep the last breadcrumb icon-only when collapsed', () => {
      setContainerWidth(fixture, 300);
      setMeasureWidths(fixture, [ 120, 140, 32 ]);
      triggerResize(fixture);

      const icon = fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active .breadcrumb-icon'));
      const hiddenTitle = fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active .visually-hidden'));

      expect(icon.nativeElement.classList.contains('ph-file-text')).toBeTrue();
      expect(hiddenTitle.nativeElement.textContent).toBe('Current task');
      expect(fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active .label'))).toBeNull();
    });

    it('should re-expand breadcrumbs when container width increases', () => {
      setContainerWidth(fixture, 300);
      setMeasureWidths(fixture, [ 120, 140, 32 ]);
      triggerResize(fixture);

      expect(fixture.componentInstance.collapsedCount()).toBe(1);
      expect(fixture.debugElement.query(By.css('.breadcrumb-list .collapsed-trigger'))).toBeTruthy();

      setContainerWidth(fixture, 500);
      triggerResize(fixture);

      expect(fixture.componentInstance.collapsedCount()).toBe(0);
      expect(fixture.debugElement.query(By.css('.breadcrumb-list .collapsed-trigger'))).toBeNull();
      const labels = fixture.debugElement.queryAll(By.css('.breadcrumb-list .breadcrumb-item .label'));
      expect(labels.map(label => label.nativeElement.textContent)).toEqual([ 'Root chapter', 'Middle chapter' ]);
    });

    it('should collapse after a ResizeObserver resize event', done => {
      const localFixture = TestBed.createComponent(BreadcrumbsComponent);
      const rafSpy = spyOn(window, 'requestAnimationFrame').and.callFake((_callback: FrameRequestCallback) => 1);
      localFixture.detectChanges();

      setContainerWidth(localFixture, 300);
      setMeasureWidths(localFixture, [ 120, 140, 32 ]);

      MockResizeObserver.callback?.();
      const callback = rafSpy.calls.mostRecent().args[0] as FrameRequestCallback;
      mockListFitsContainer(localFixture);
      callback(0);

      localFixture.changeDetectorRef.markForCheck();
      localFixture.detectChanges();

      expect(localFixture.componentInstance.collapsedCount()).toBe(1);
      expect(localFixture.debugElement.query(By.css('.breadcrumb-list .collapsed-trigger'))).toBeTruthy();
      const labels = localFixture.debugElement.queryAll(By.css('.breadcrumb-list .breadcrumb-item .label'));
      expect(labels.map(label => label.nativeElement.textContent)).toEqual([ 'Middle chapter' ]);
      done();
    });

    it('should collapse further when the visible list still overflows the container', () => {
      setContainerWidth(fixture, 300);
      setMeasureWidths(fixture, [ 120, 140, 32 ]);
      triggerResize(fixture);

      const list = fixture.debugElement.query(By.css('.breadcrumb-list')).nativeElement as HTMLElement;
      Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 400 });

      (fixture.componentInstance as unknown as { correctCollapsedCountFromOverflow(): void })
        .correctCollapsedCountFromOverflow();
      fixture.detectChanges();

      expect(fixture.componentInstance.collapsedCount()).toBe(2);
      expect(fixture.debugElement.queryAll(By.css('.breadcrumb-list .breadcrumb-item .label')).length).toBe(0);
    });
  });

  describe('last-item label ellipsis with collapse', () => {
    let fixture: ComponentFixture<BreadcrumbsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ BreadcrumbsComponent ],
        providers: [
          provideMockStore({
            selectors: [
              {
                selector: fromCurrentContent.selectBreadcrumbs,
                value: [
                  { title: 'Root chapter', navigateTo: (): void => {} },
                  { title: 'Very long current chapter title' },
                ],
              },
              { selector: fromCurrentContent.selectTitle, value: undefined },
            ],
          }),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BreadcrumbsComponent);
      fixture.detectChanges();
    });

    it('should apply label-ellipsis when the last visible label exceeds width minus ellipsis overhead', () => {
      setContainerWidth(fixture, 100);
      setMeasureWidths(fixture, [ 80, 120 ]);
      triggerResize(fixture);

      expect(fixture.componentInstance.collapsedCount()).toBe(1);
      expect(fixture.componentInstance.lastItemEllipsis()).toBeTrue();
      expect(
        fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active.label-ellipsis'))
      ).toBeTruthy();
    });
  });

  describe('last-item label ellipsis without collapse', () => {
    let fixture: ComponentFixture<BreadcrumbsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ BreadcrumbsComponent ],
        providers: [
          provideMockStore({
            selectors: [
              {
                selector: fromCurrentContent.selectBreadcrumbs,
                value: [ { title: 'Very long single breadcrumb title' } ],
              },
              { selector: fromCurrentContent.selectTitle, value: undefined },
            ],
          }),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BreadcrumbsComponent);
      fixture.detectChanges();
    });

    it('should apply label-ellipsis when a single breadcrumb exceeds the container width', () => {
      setContainerWidth(fixture, 100);
      setMeasureWidths(fixture, [ 200 ]);
      triggerResize(fixture);

      expect(fixture.componentInstance.collapsedCount()).toBe(0);
      expect(fixture.componentInstance.lastItemEllipsis()).toBeTrue();
      expect(
        fixture.debugElement.query(By.css('.breadcrumb-list .breadcrumb-item.active.label-ellipsis'))
      ).toBeTruthy();
    });
  });
});
