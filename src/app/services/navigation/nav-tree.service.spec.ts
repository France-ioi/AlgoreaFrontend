import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ContentInfo, RoutedContentInfo } from 'src/app/models/content/content-info';
import { NavTreeData, NavTreeElement } from 'src/app/models/left-nav-loading/nav-tree-data';
import { EntityPathRoute } from 'src/app/models/routing/entity-route';
import { CurrentContentService } from 'src/app/services/current-content.service';
import { NavTreeService } from './nav-tree.service';

interface TestRoute extends EntityPathRoute {
  attemptId?: string,
  parentAttemptId?: string,
}

interface TestContent extends RoutedContentInfo {
  type: 'test',
  route: TestRoute,
  mayHaveChildren: boolean,
}

interface FetchCreation {
  path: EntityPathRoute['path'],
  attemptId: string|undefined,
}

function treeEl(id: string, path: string[]): NavTreeElement {
  return {
    route: { contentType: 'activity', id, path },
    title: id,
    hasChildren: true,
    navigateTo: (): void => {},
  };
}

/** Nav payload whose `elements` include `selectedId` so `withUpdatedElement` does not throw. */
function navDataFor(
  selectedId: string,
  pathToElements: string[],
): { parent: NavTreeElement, elements: NavTreeElement[] } {
  return {
    parent: treeEl(pathToElements[pathToElements.length - 1] ?? 'root', pathToElements.slice(0, -1)),
    elements: [ treeEl(selectedId, pathToElements), treeEl(`${selectedId}-sib`, pathToElements) ],
  };
}

function testContent(
  id: string,
  path: string[],
  opts: { attemptId?: string, parentAttemptId?: string, mayHaveChildren?: boolean } = {},
): TestContent {
  return {
    type: 'test',
    route: { contentType: 'activity', id, path, attemptId: opts.attemptId, parentAttemptId: opts.parentAttemptId },
    mayHaveChildren: opts.mayHaveChildren ?? true,
  };
}

/**
 * Minimal concrete NavTreeService for cache-reuse tests.
 * Counts `fetch()` creations (scan identity) rather than data-method spy calls, because reused
 * FetchInfo objects can re-subscribe through shareReplay when switchMap swaps combineLatest.
 */
@Injectable()
class TestNavTreeService extends NavTreeService<TestContent> {

  readonly fetchCreations: FetchCreation[] = [];

  constructor(private readonly useAttempts: boolean) {
    super();
  }

  protected override fetch(
    path: EntityPathRoute['path'],
    attemptId: string|undefined,
    fetch: () => Observable<NavTreeData>,
  ): ReturnType<NavTreeService<TestContent>['fetch']> {
    this.fetchCreations.push({ path, attemptId });
    return super.fetch(path, attemptId, fetch);
  }

  protected override selfAttemptOf(content: TestContent): string|undefined {
    return this.useAttempts ? content.route.attemptId : undefined;
  }

  protected override parentAttemptOf(content: TestContent): string|undefined {
    return this.useAttempts ? content.route.parentAttemptId : undefined;
  }

  protected isOfContentType(content: ContentInfo|null): content is TestContent {
    return content !== null && content.type === 'test';
  }

  protected addDetailsToTreeElement(treeElement: NavTreeElement, _contentInfo: TestContent): NavTreeElement {
    return treeElement;
  }

  protected fetchRootTreeData(): Observable<NavTreeElement[]> {
    return of([ treeEl('root', []) ]);
  }

  protected fetchNavData(route: EntityPathRoute): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return of(navDataFor('child', [ ...route.path, route.id ]));
  }

  protected fetchNavDataFromChild(
    _id: string,
    child: TestContent,
  ): Observable<{ parent: NavTreeElement, elements: NavTreeElement[] }> {
    return of(navDataFor(child.route.id, child.route.path));
  }

  protected contentInfoFromNavTreeParent(e: NavTreeElement): ContentInfo {
    return { type: 'test', route: e.route };
  }

  protected dummyRootContent(): TestContent {
    return testContent('dummy', [], { parentAttemptId: '0', mayHaveChildren: false });
  }

  protected canFetchChildren(content: ContentInfo): boolean {
    return this.isOfContentType(content) && content.mayHaveChildren;
  }
}

describe('NavTreeService fetch reuse', () => {
  let currentContent: CurrentContentService;

  function setup(useAttempts: boolean): TestNavTreeService {
    TestBed.configureTestingModule({
      providers: [
        CurrentContentService,
        { provide: TestNavTreeService, useFactory: (): TestNavTreeService => new TestNavTreeService(useAttempts) },
      ],
    });
    currentContent = TestBed.inject(CurrentContentService);
    const service = TestBed.inject(TestNavTreeService);
    service.state$.subscribe({ error: (): void => undefined });
    return service;
  }

  function creationsSince(service: TestNavTreeService, fromIndex: number): FetchCreation[] {
    return service.fetchCreations.slice(fromIndex);
  }

  describe('with attempt-aware hooks', () => {
    let service: TestNavTreeService;

    beforeEach(() => {
      service = setup(true);
    });

    it('refetches children but not siblings when only the self attempt changes', () => {
      const chapter = (attemptId: string): TestContent =>
        testContent('C', [ 'P' ], { attemptId, parentAttemptId: '0', mayHaveChildren: true });

      currentContent.replace(chapter('1'));
      expect(service.fetchCreations.length).toBe(2); // siblings + children

      const afterFirst = service.fetchCreations.length;
      currentContent.replace(chapter('2'));
      const created = creationsSince(service, afterFirst);

      // CASE 5: new children fetch only (keyed by new self attempt)
      expect(created).toEqual([ { path: [ 'P', 'C' ], attemptId: '2' } ]);
    });

    it('reuses siblings and refetches children when navigating between siblings', () => {
      currentContent.replace(testContent('A', [ 'P' ], { attemptId: '1', parentAttemptId: '0' }));
      const afterFirst = service.fetchCreations.length;

      currentContent.replace(testContent('B', [ 'P' ], { attemptId: '1', parentAttemptId: '0' }));
      const created = creationsSince(service, afterFirst);

      expect(created).toEqual([ { path: [ 'P', 'B' ], attemptId: '1' } ]);
    });

    it('reuses fetches when navigating to a child then back to the parent (CASE 6 / 7)', () => {
      const parent = testContent('C', [ 'P' ], { attemptId: '1', parentAttemptId: '0' });
      const child = testContent('D', [ 'P', 'C' ], { attemptId: '10', parentAttemptId: '1' });

      currentContent.replace(parent);
      const afterParent = service.fetchCreations.length;

      currentContent.replace(child);
      // CASE 6: previous l2 becomes l1 — only the new children fetch
      expect(creationsSince(service, afterParent)).toEqual([ { path: [ 'P', 'C', 'D' ], attemptId: '10' } ]);

      const afterChild = service.fetchCreations.length;
      currentContent.replace(parent);
      // CASE 7: previous l1 becomes l2 — only the new siblings fetch
      expect(creationsSince(service, afterChild)).toEqual([ { path: [ 'P' ], attemptId: '0' } ]);
    });

    it('reuses l1+l2 when navigating to a leaf child whose route has only attemptId (no pa)', () => {
      // Content-area child links often XOR attempt vs parentAttempt; missing pa must not force CASE 8.
      const parent = testContent('C', [ 'P' ], { attemptId: '1', parentAttemptId: '0', mayHaveChildren: true });
      const leaf = testContent('D', [ 'P', 'C' ], { attemptId: '10', mayHaveChildren: false });

      currentContent.replace(parent);
      const afterParent = service.fetchCreations.length;

      currentContent.replace(leaf);
      expect(creationsSince(service, afterParent)).toEqual([]);
    });
  });

  describe('with group-style hooks (no attempts)', () => {
    let service: TestNavTreeService;

    beforeEach(() => {
      service = setup(false);
    });

    it('reuses both fetches when only unused attempt fields change', () => {
      currentContent.replace(testContent('C', [ 'P' ], { attemptId: '1', parentAttemptId: '0' }));
      const afterFirst = service.fetchCreations.length;

      currentContent.replace(testContent('C', [ 'P' ], { attemptId: '2', parentAttemptId: '0' }));

      expect(creationsSince(service, afterFirst)).toEqual([]);
    });
  });
});
