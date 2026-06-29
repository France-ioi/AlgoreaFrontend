import { BreakpointObserver } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { UrlSerializer } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { APPCONFIG, AppConfig } from '../config';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutService,
        provideMockStore(),
        {
          provide: BreakpointObserver,
          useValue: { observe: (): ReturnType<BreakpointObserver['observe']> => of({ matches: false, breakpoints: {} }) },
        },
        { provide: APPCONFIG, useValue: { redirects: [], hideLeftMenuTreeOnItemIds: [] } as unknown as AppConfig },
        { provide: Location, useValue: { path: (): string => '' } },
        { provide: UrlSerializer, useValue: { parse: (): unknown => ({ root: { children: {} } }) } },
      ],
    });
    service = TestBed.inject(LayoutService);
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
});
