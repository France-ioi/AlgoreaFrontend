import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { defer, of, throwError } from 'rxjs';
import { GetBreadcrumbService, BreadcrumbItem } from '../data-access/get-breadcrumb.service';
import { ResultActionsService } from 'src/app/data-access/result-actions.service';
import { itemRoute } from 'src/app/models/routing/item-route';
import { ItemBreadcrumbsWithFailoverService } from './item-breadcrumbs-with-failover.service';

describe('ItemBreadcrumbsWithFailoverService', () => {
  const mockBreadcrumbs = 'mockBreadcrumbs' as unknown as BreadcrumbItem[];
  const forbidden = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });

  afterEach(() => TestBed.resetTestingModule());

  function setup(
    breadcrumbService: jasmine.SpyObj<GetBreadcrumbService>,
    resultActionsService: jasmine.SpyObj<ResultActionsService>,
  ): ItemBreadcrumbsWithFailoverService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ItemBreadcrumbsWithFailoverService,
        { provide: GetBreadcrumbService, useValue: breadcrumbService },
        { provide: ResultActionsService, useValue: resultActionsService },
      ],
    });
    return TestBed.inject(ItemBreadcrumbsWithFailoverService);
  }

  it('starts the path, retries breadcrumbs, and emits local resultPathStarted$', () => {
    const route = itemRoute('activity', '1', { attemptId: '0', path: [ '10' ] });
    const breadcrumbService = jasmine.createSpyObj<GetBreadcrumbService>('GetBreadcrumbService', [ 'getBreadcrumb' ]);
    const resultActionsService = jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'startWithoutAttempt' ]);
    let breadcrumbSubscriptions = 0;
    breadcrumbService.getBreadcrumb.and.returnValue(defer(() => {
      breadcrumbSubscriptions += 1;
      if (breadcrumbSubscriptions === 1) return throwError(() => forbidden);
      return of(mockBreadcrumbs);
    }));
    resultActionsService.startWithoutAttempt.and.callFake(() => of('42'));

    const service = setup(breadcrumbService, resultActionsService);

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

    expect(error).toBeUndefined();
    expect(resultActionsService.startWithoutAttempt).toHaveBeenCalledOnceWith([ '10', '1' ]);
    expect(breadcrumbSubscriptions).toBe(2);
    expect(result).toEqual(mockBreadcrumbs);
    expect(localStartCount).toBe(1);
  });

  it('skips failover when the path is empty', () => {
    const route = itemRoute('activity', '1', { parentAttemptId: '0', path: [] });
    const breadcrumbService = jasmine.createSpyObj<GetBreadcrumbService>('GetBreadcrumbService', [ 'getBreadcrumb' ]);
    const resultActionsService = jasmine.createSpyObj<ResultActionsService>('ResultActionsService', [ 'startWithoutAttempt' ]);
    breadcrumbService.getBreadcrumb.and.returnValue(throwError(() => forbidden));

    const service = setup(breadcrumbService, resultActionsService);

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
