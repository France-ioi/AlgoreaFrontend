import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ItemNavigationService } from 'src/app/data-access/item-navigation.service';
import { ItemInfo, itemInfo } from 'src/app/models/content/item-info';
import { NavTreeElement } from 'src/app/models/left-nav-loading/nav-tree-data';
import { itemRoute, newAttemptId, FullItemRoute } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ItemViewPerm } from 'src/app/items/models/item-view-permission';
import { ItemEditPerm } from 'src/app/items/models/item-edit-permission';
import { ItemGrantViewPerm } from 'src/app/items/models/item-grant-view-permission';
import { ItemWatchPerm } from 'src/app/items/models/item-watch-permission';
import { fromObservation } from 'src/app/store/observation';
import { ActivityNavTreeService } from './item-nav-tree.service';

/** Exposes protected ItemNavTreeService hooks for focused assertions. */
@Injectable()
class TestableActivityNavTreeService extends ActivityNavTreeService {
  exposeAddDetails(treeElement: NavTreeElement, contentInfo: ItemInfo): NavTreeElement {
    return this.addDetailsToTreeElement(treeElement, contentInfo);
  }

  exposeCanFetchChildren(content: ItemInfo): boolean {
    return this.canFetchChildren(content);
  }

  exposeSelfAttemptOf(content: ItemInfo): string|undefined {
    return this.selfAttemptOf(content);
  }

  exposeParentAttemptOf(content: ItemInfo): string|undefined {
    return this.parentAttemptOf(content);
  }
}

function chapterInfo(routeAttrs: Omit<FullItemRoute, 'contentType'|'id'>): ItemInfo {
  return itemInfo({
    route: itemRoute('activity', 'item-1', routeAttrs),
    details: {
      title: 'Chapter',
      type: 'Chapter',
      permissions: {
        canView: ItemViewPerm.Content,
        canGrantView: ItemGrantViewPerm.None,
        canEdit: ItemEditPerm.None,
        canWatch: ItemWatchPerm.None,
        isOwner: false,
      },
    },
  });
}

describe('ItemNavTreeService', () => {
  let service: TestableActivityNavTreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestableActivityNavTreeService,
        provideMockStore({
          selectors: [ { selector: fromObservation.selectObservedGroupId, value: null } ],
        }),
        { provide: ItemNavigationService, useValue: {} },
        { provide: ItemRouter, useValue: jasmine.createSpyObj('ItemRouter', [ 'navigateTo' ]) },
      ],
    });
    service = TestBed.inject(TestableActivityNavTreeService);
  });

  describe('addDetailsToTreeElement', () => {
    it('copies the current content attempt fields onto the tree element route without changing id/path', () => {
      const fetchedRoute = itemRoute('activity', 'item-1', {
        path: [ 'parent' ],
        attemptId: 'old-attempt',
        parentAttemptId: 'old-parent',
      });
      const treeElement: NavTreeElement = {
        route: fetchedRoute,
        title: 'Fetched title',
        hasChildren: true,
        navigateTo: (): void => {},
      };
      const contentInfo = chapterInfo({
        path: [ 'parent' ],
        attemptId: 'new-attempt',
        parentAttemptId: 'new-parent',
        answer: { id: 'answer-should-not-leak' },
      });

      const updated = service.exposeAddDetails(treeElement, contentInfo);

      expect(updated.route.id).toBe('item-1');
      expect(updated.route.path).toEqual([ 'parent' ]);
      expect(updated.route).toEqual(jasmine.objectContaining({
        attemptId: 'new-attempt',
        parentAttemptId: 'new-parent',
      }));
      expect(updated.route).not.toEqual(jasmine.objectContaining({ answer: { id: 'answer-should-not-leak' } }));
      expect(updated.title).toBe('Chapter');
    });
  });

  describe('attempt fetch identity', () => {
    it('exposes route attempt fields via selfAttemptOf / parentAttemptOf', () => {
      const content = chapterInfo({
        path: [ 'parent' ],
        attemptId: 'self-1',
        parentAttemptId: 'parent-0',
      });

      expect(service.exposeSelfAttemptOf(content)).toBe('self-1');
      expect(service.exposeParentAttemptOf(content)).toBe('parent-0');
    });

    it('does not allow children fetch when attemptId is the a=new sentinel', () => {
      const content = chapterInfo({
        path: [ 'parent' ],
        attemptId: newAttemptId,
        parentAttemptId: 'parent-0',
      });

      // Gates children before selfAttemptOf can key a fetch with 'new'
      expect(service.exposeCanFetchChildren(content)).toBe(false);
      expect(service.exposeSelfAttemptOf(content)).toBe(newAttemptId);
    });
  });
});
