import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { GetBreadcrumbService, BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { itemRoute, newAttemptId } from 'src/app/models/routing/item-route';
import { ItemBreadcrumbsWithFailoverService } from './item-breadcrumbs-with-failover.service';

describe('ItemBreadcrumbsWithFailoverService', () => {
  const mockBreadcrumbs = 'mockBreadcrumbs' as unknown as BreadcrumbItem[];
  const forbidden = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
  const otherError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
  const replaceNavExtras = {
    navExtras: { replaceUrl: true },
    loadAnswerIdAsCurrent: undefined,
    useCurrentObservation: true,
  };

  afterEach(() => TestBed.resetTestingModule());

  function setup(
    breadcrumbService: jasmine.SpyObj<GetBreadcrumbService>,
    resultActionsService: jasmine.SpyObj<ResultActionsService>,
    itemRouter: jasmine.SpyObj<ItemRouter>,
  ): ItemBreadcrumbsWithFailoverService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ItemBreadcrumbsWithFailoverService,
        { provide: GetBreadcrumbService, useValue: breadcrumbService },
        { provide: ResultActionsService, useValue: resultActionsService },
        { provide: ItemRouter, useValue: itemRouter },
      ],
    });
    return TestBed.inject(ItemBreadcrumbsWithFailoverService);
  }

  function createSpies(): {
    breadcrumbService: jasmine.SpyObj<GetBreadcrumbService>,
    resultActionsService: jasmine.SpyObj<ResultActionsService>,
    itemRouter: jasmine.SpyObj<ItemRouter>,
  } {
    return {
      breadcrumbService: jasmine.createSpyObj<GetBreadcrumbService>('GetBreadcrumbService', [ 'getBreadcrumb' ]),
      resultActionsService: jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'startWithoutAttempt' ]),
      itemRouter: jasmine.createSpyObj<ItemRouter>('ItemRouter', [ 'navigateTo' ]),
    };
  }

  // jasmine.clock advances RxJS delay(0) used by replaceUrl navigation (zoneless: no fakeAsync).
  describe('with delay(0) navigation', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('parent attempt: starts ancestors, retries with returned parentAttemptId, and navigates', () => {
      const extras = { answer: { id: 'ans-1' } as const, observedGroup: { id: 'g1', isUser: false } };
      const route = itemRoute('activity', '1', { parentAttemptId: '0', path: [ '10' ], ...extras });
      const recovered = itemRoute('activity', '1', { parentAttemptId: '42', path: [ '10' ], ...extras });
      const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
      breadcrumbService.getBreadcrumb.and.returnValues(throwError(() => forbidden), of(mockBreadcrumbs));
      resultActionsService.startWithoutAttempt.and.returnValue(of('42'));

      const service = setup(breadcrumbService, resultActionsService, itemRouter);
      let localStartCount = 0;
      service.resultPathStarted$.subscribe(() => {
        localStartCount += 1;
      });

      let result: BreadcrumbItem[] | undefined;
      let error: unknown;
      service.get(route).subscribe({
        next: data => {
          result = data;
        },
        error: err => {
          error = err;
        },
      });
      jasmine.clock().tick(0);

      expect(error).toBeUndefined();
      expect(resultActionsService.startWithoutAttempt).toHaveBeenCalledOnceWith([ '10' ]);
      expect(breadcrumbService.getBreadcrumb.calls.argsFor(1)).toEqual([ recovered ]);
      expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(recovered, replaceNavExtras);
      expect(result).toEqual(mockBreadcrumbs);
      expect(localStartCount).toBe(1);
    });

    it('self attempt: starts path including item, retries with returned attemptId, and navigates', () => {
      const route = itemRoute('activity', '1', { attemptId: '0', path: [ '10' ] });
      const recovered = itemRoute('activity', '1', { attemptId: '42', path: [ '10' ], parentAttemptId: undefined });
      const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
      breadcrumbService.getBreadcrumb.and.returnValues(throwError(() => forbidden), of(mockBreadcrumbs));
      resultActionsService.startWithoutAttempt.and.returnValue(of('42'));

      const service = setup(breadcrumbService, resultActionsService, itemRouter);
      let localStartCount = 0;
      service.resultPathStarted$.subscribe(() => {
        localStartCount += 1;
      });

      let result: BreadcrumbItem[] | undefined;
      service.get(route).subscribe({
        next: data => {
          result = data;
        },
      });
      jasmine.clock().tick(0);

      expect(resultActionsService.startWithoutAttempt).toHaveBeenCalledOnceWith([ '10', '1' ]);
      expect(breadcrumbService.getBreadcrumb.calls.argsFor(1)).toEqual([ recovered ]);
      expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(recovered, replaceNavExtras);
      expect(result).toEqual(mockBreadcrumbs);
      expect(localStartCount).toBe(1);
    });

    it('a=new with parentAttemptId: starts ancestors only and keeps attemptId new on retry', () => {
      const route = itemRoute('activity', '1', { attemptId: newAttemptId, parentAttemptId: '0', path: [ '10' ] });
      const recovered = itemRoute('activity', '1', { attemptId: newAttemptId, parentAttemptId: '42', path: [ '10' ] });
      const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
      breadcrumbService.getBreadcrumb.and.returnValues(throwError(() => forbidden), of(mockBreadcrumbs));
      resultActionsService.startWithoutAttempt.and.returnValue(of('42'));

      const service = setup(breadcrumbService, resultActionsService, itemRouter);

      let result: BreadcrumbItem[] | undefined;
      service.get(route).subscribe({
        next: data => {
          result = data;
        },
      });
      jasmine.clock().tick(0);

      expect(resultActionsService.startWithoutAttempt).toHaveBeenCalledOnceWith([ '10' ]);
      expect(breadcrumbService.getBreadcrumb.calls.argsFor(1)).toEqual([ recovered ]);
      expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(recovered, replaceNavExtras);
      expect(result).toEqual(mockBreadcrumbs);
    });

    it('self attempt with parentAttemptId: starts including item, clears pa, and navigates', () => {
      const route = itemRoute('activity', '1', { attemptId: '42', parentAttemptId: '0', path: [ '10' ] });
      const recovered = itemRoute('activity', '1', { attemptId: '42', path: [ '10' ], parentAttemptId: undefined });
      const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
      breadcrumbService.getBreadcrumb.and.returnValues(throwError(() => forbidden), of(mockBreadcrumbs));
      resultActionsService.startWithoutAttempt.and.returnValue(of('42'));

      const service = setup(breadcrumbService, resultActionsService, itemRouter);
      service.get(route).subscribe();
      jasmine.clock().tick(0);

      expect(resultActionsService.startWithoutAttempt).toHaveBeenCalledOnceWith([ '10', '1' ]);
      expect(breadcrumbService.getBreadcrumb.calls.argsFor(1)).toEqual([ recovered ]);
      expect(itemRouter.navigateTo).toHaveBeenCalledOnceWith(recovered, replaceNavExtras);
    });

    it('does not navigate when the returned attempt matches the URL', () => {
      const route = itemRoute('activity', '1', { attemptId: '42', path: [ '10' ] });
      const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
      breadcrumbService.getBreadcrumb.and.returnValues(throwError(() => forbidden), of(mockBreadcrumbs));
      resultActionsService.startWithoutAttempt.and.returnValue(of('42'));

      const service = setup(breadcrumbService, resultActionsService, itemRouter);

      let result: BreadcrumbItem[] | undefined;
      service.get(route).subscribe({
        next: data => {
          result = data;
        },
      });
      jasmine.clock().tick(0);

      expect(resultActionsService.startWithoutAttempt).toHaveBeenCalledOnceWith([ '10', '1' ]);
      expect(breadcrumbService.getBreadcrumb.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({
        attemptId: '42',
        parentAttemptId: undefined,
      }));
      expect(itemRouter.navigateTo).not.toHaveBeenCalled();
      expect(result).toEqual(mockBreadcrumbs);
    });

    it('propagates a second 403 after retry and navigates once', () => {
      const route = itemRoute('activity', '1', { parentAttemptId: '0', path: [ '10' ] });
      const recovered = itemRoute('activity', '1', { parentAttemptId: '42', path: [ '10' ] });
      const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
      breadcrumbService.getBreadcrumb.and.returnValues(throwError(() => forbidden), throwError(() => forbidden));
      resultActionsService.startWithoutAttempt.and.returnValue(of('42'));

      const service = setup(breadcrumbService, resultActionsService, itemRouter);

      let error: unknown;
      service.get(route).subscribe({
        error: err => {
          error = err;
        },
      });
      jasmine.clock().tick(0);

      expect(error).toBe(forbidden);
      expect(breadcrumbService.getBreadcrumb).toHaveBeenCalledTimes(2);
      expect(breadcrumbService.getBreadcrumb.calls.argsFor(1)).toEqual([ recovered ]);
      expect(itemRouter.navigateTo).toHaveBeenCalledTimes(1);
    });
  });

  it('rethrows the original 403 when start fails, without retry or navigation', () => {
    const route = itemRoute('activity', '1', { attemptId: '0', path: [ '10' ] });
    const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
    breadcrumbService.getBreadcrumb.and.returnValue(throwError(() => forbidden));
    resultActionsService.startWithoutAttempt.and.returnValue(throwError(() => otherError));

    const service = setup(breadcrumbService, resultActionsService, itemRouter);
    let localStartCount = 0;
    service.resultPathStarted$.subscribe(() => {
      localStartCount += 1;
    });

    let error: unknown;
    service.get(route).subscribe({
      error: err => {
        error = err;
      },
    });

    expect(error).toBe(forbidden);
    expect(breadcrumbService.getBreadcrumb).toHaveBeenCalledTimes(1);
    expect(itemRouter.navigateTo).not.toHaveBeenCalled();
    expect(localStartCount).toBe(0);
  });

  it('does not start or retry when the first error is not 403', () => {
    const route = itemRoute('activity', '1', { attemptId: '0', path: [ '10' ] });
    const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
    breadcrumbService.getBreadcrumb.and.returnValue(throwError(() => otherError));

    const service = setup(breadcrumbService, resultActionsService, itemRouter);

    let error: unknown;
    service.get(route).subscribe({
      error: err => {
        error = err;
      },
    });

    expect(error).toBe(otherError);
    expect(resultActionsService.startWithoutAttempt).not.toHaveBeenCalled();
    expect(breadcrumbService.getBreadcrumb).toHaveBeenCalledTimes(1);
    expect(itemRouter.navigateTo).not.toHaveBeenCalled();
  });

  it('skips failover when the path is empty', () => {
    const route = itemRoute('activity', '1', { parentAttemptId: '0', path: [] });
    const { breadcrumbService, resultActionsService, itemRouter } = createSpies();
    breadcrumbService.getBreadcrumb.and.returnValue(throwError(() => forbidden));

    const service = setup(breadcrumbService, resultActionsService, itemRouter);

    let error: unknown;
    service.get(route).subscribe({
      error: err => {
        error = err;
      },
    });

    expect(resultActionsService.startWithoutAttempt).not.toHaveBeenCalled();
    expect(error).toBe(forbidden);
  });
});
