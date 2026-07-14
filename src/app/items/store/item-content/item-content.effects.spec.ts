import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, toArray } from 'rxjs';
import { dispatchCurrentContentEffect } from './item-content.effects';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { displaySettingsSchema } from '../../models/display-settings';
import { ItemViewPerm } from '../../models/item-view-permission';

describe('dispatchCurrentContentEffect', () => {
  let store: MockStore<object>;
  let currentContent$: Subject<{
    route: { id: string, path: string[], contentType: 'activity', attemptId: string },
    breadcrumbs: {
      itemId: string,
      title: string,
      route: { id: string, path: string[], contentType: 'activity', attemptId: string },
    }[],
    item: {
      string: { title: string },
      type: 'Task',
      requiresExplicitEntry: boolean,
      permissions: { canView: ItemViewPerm, canRequestHelp: boolean },
      displaySettings: ReturnType<typeof displaySettingsSchema.parse>,
    },
  } | null>;

  beforeEach(() => {
    currentContent$ = new Subject();

    TestBed.configureTestingModule({
      providers: [
        provideMockStore(),
        { provide: ItemRouter, useValue: { navigateTo: jasmine.createSpy('navigateTo') } },
      ],
    });

    store = TestBed.inject(MockStore) as MockStore<object>;
    spyOn(store, 'select').and.returnValue(currentContent$.asObservable());
  });

  it('should dispatch breadcrumbs with a resolved icon on the last element', done => {
    const emitted: Action[] = [];
    TestBed.runInInjectionContext(() => dispatchCurrentContentEffect()).pipe(toArray()).subscribe({
      next: actions => {
        emitted.push(...actions);
        const action = emitted[0] as ReturnType<typeof fromCurrentContent.contentPageActions.changeContent>;
        expect(action.breadcrumbs?.[0]!.icon).toBeUndefined();
        expect(action.breadcrumbs?.[1]!.icon).toBe('ph-file-text');
        done();
      },
    });

    currentContent$.next({
      route: { id: 'task-1', path: [ 'chapter-1' ], contentType: 'activity', attemptId: '0' },
      breadcrumbs: [
        {
          itemId: 'chapter-1',
          title: 'Chapter',
          route: { id: 'chapter-1', path: [], contentType: 'activity', attemptId: '0' },
        },
        {
          itemId: 'task-1',
          title: 'Task',
          route: { id: 'task-1', path: [ 'chapter-1' ], contentType: 'activity', attemptId: '0' },
        },
      ],
      item: {
        string: { title: 'Task' },
        type: 'Task',
        requiresExplicitEntry: false,
        permissions: { canView: ItemViewPerm.Content, canRequestHelp: false },
        displaySettings: displaySettingsSchema.parse({}),
      },
    });
    currentContent$.complete();
  });
});
