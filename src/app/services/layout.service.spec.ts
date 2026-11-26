import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { UrlSerializer } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, Subscription } from 'rxjs';

import { APPCONFIG, AppConfig } from '../config';
import { narrowScreenMediaQuery } from '../utils/layout-breakpoints';
import { ContentDisplayType, LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;
  let observeSpy: jasmine.Spy;
  let breakpoint$: BehaviorSubject<BreakpointState>;

  beforeEach(() => {
    breakpoint$ = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
    observeSpy = jasmine.createSpy('observe').and.returnValue(breakpoint$);
    TestBed.configureTestingModule({
      providers: [
        LayoutService,
        provideMockStore(),
        {
          provide: BreakpointObserver,
          useValue: { observe: observeSpy },
        },
        { provide: APPCONFIG, useValue: { redirects: [], hideLeftMenuTreeOnItemIds: [] } as unknown as AppConfig },
        { provide: Location, useValue: { path: (): string => '' } },
        { provide: UrlSerializer, useValue: { parse: (): unknown => ({ root: { children: {} } }) } },
      ],
    });
    service = TestBed.inject(LayoutService);
  });

  it('observes the narrow-screen media query for isNarrowScreen$', () => {
    expect(observeSpy).toHaveBeenCalledWith(narrowScreenMediaQuery);
  });

  it('emits search active changes through searchActive$', () => {
    const emitted: boolean[] = [];
    const sub = service.searchActive$.subscribe(value => emitted.push(value));

    service.setLeftMenuSearchActive(true);
    service.setLeftMenuSearchActive(false);

    sub.unsubscribe();
    // initial false, then true, then false
    expect(emitted).toEqual([ false, true, false ]);
  });

  it('dedups repeated identical values via distinctUntilChanged', () => {
    const emitted: boolean[] = [];
    const sub = service.searchActive$.subscribe(value => emitted.push(value));

    service.setLeftMenuSearchActive(true);
    service.setLeftMenuSearchActive(true);
    service.setLeftMenuSearchActive(false);
    service.setLeftMenuSearchActive(false);

    sub.unsubscribe();
    expect(emitted).toEqual([ false, true, false ]);
  });

  describe('leftMenu$', () => {
    let shown: boolean | undefined;
    let sub: Subscription;

    function display(contentDisplayType: ContentDisplayType, contentId = 'task-1'): void {
      service.configure({ contentDisplayType, contentId });
      tick();
    }

    function toggle(visible: boolean): void {
      service.toggleLeftMenu(visible);
      tick();
    }

    function start(isNarrowScreen = false): void {
      breakpoint$.next({ matches: isNarrowScreen, breakpoints: {} });
      sub = service.leftMenu$.subscribe(state => shown = state.shown);
      tick();
    }

    function tick(): void {
      jasmine.clock().tick(1);
    }

    beforeEach(() => jasmine.clock().install());

    afterEach(() => {
      sub.unsubscribe();
      jasmine.clock().uninstall();
    });

    it('hides the menu when entering the full-frame layout', () => {
      start();
      display(ContentDisplayType.Show);
      expect(shown).toBeTrue();

      display(ContentDisplayType.ShowFullFrame);
      expect(shown).toBeFalse();
    });

    it('does not show the menu when leaving the full-frame layout', () => {
      start();
      display(ContentDisplayType.ShowFullFrame);
      display(ContentDisplayType.Show);
      expect(shown).toBeFalse();
    });

    it('keeps a manual reopen when entering the full-frame layout again on the same content', () => {
      start();
      display(ContentDisplayType.ShowFullFrame);
      toggle(true);
      display(ContentDisplayType.Show);
      display(ContentDisplayType.ShowFullFrame);
      expect(shown).toBeTrue();
    });

    it('keeps a manual choice made before the first full-frame entry on that content', () => {
      start();
      display(ContentDisplayType.Show);
      toggle(true);
      display(ContentDisplayType.ShowFullFrame);
      expect(shown).toBeTrue();
    });

    it('hides the menu again when entering the full-frame layout on another content', () => {
      start();
      display(ContentDisplayType.ShowFullFrame);
      toggle(true);
      display(ContentDisplayType.Show, 'task-2');
      display(ContentDisplayType.ShowFullFrame, 'task-2');
      expect(shown).toBeFalse();
    });

    it('on a narrow screen, still hides the menu when a task page becomes ready', () => {
      start(true);
      toggle(true);
      display(ContentDisplayType.Show);
      expect(shown).toBeFalse();
    });

    it('on a narrow screen, does not hide a manually opened menu when leaving the full-frame layout', () => {
      start(true);
      display(ContentDisplayType.ShowFullFrame);
      toggle(true);
      display(ContentDisplayType.Show);
      expect(shown).toBeTrue();
    });

    it('on a narrow screen, keeps the menu open after leaving the full-frame layout when other layout inputs change', () => {
      start(true);
      display(ContentDisplayType.ShowFullFrame);
      display(ContentDisplayType.Show);
      toggle(true);
      service.configure({ canShowLeftMenu: true });
      tick();
      expect(shown).toBeTrue();
    });

    it('shows the menu when widening the window outside the full-frame layout', () => {
      start(true);
      display(ContentDisplayType.Show);
      breakpoint$.next({ matches: false, breakpoints: {} });
      tick();
      expect(shown).toBeTrue();
    });
  });
});
