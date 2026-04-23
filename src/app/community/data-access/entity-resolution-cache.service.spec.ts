import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EntityResolutionCacheService } from './entity-resolution-cache.service';
import { GetItemByIdService } from '../../data-access/get-item-by-id.service';
import { Item } from '../../data-access/get-item-by-id.service';

function mockItem(title: string): Item {
  return { string: { title } } as Item;
}

describe('EntityResolutionCacheService', () => {
  let service: EntityResolutionCacheService;
  let getItemByIdService: jasmine.SpyObj<GetItemByIdService>;

  beforeEach(() => {
    getItemByIdService = jasmine.createSpyObj<GetItemByIdService>('GetItemByIdService', [ 'get' ]);

    TestBed.configureTestingModule({
      providers: [
        EntityResolutionCacheService,
        { provide: GetItemByIdService, useValue: getItemByIdService },
      ],
    });

    service = TestBed.inject(EntityResolutionCacheService);
  });

  describe('resolveItem', () => {
    it('should fetch and return item title', (done: DoneFn) => {
      getItemByIdService.get.and.returnValue(of(mockItem('Algebra 101')));

      service.resolveItem('item-1').subscribe(title => {
        expect(title).toBe('Algebra 101');
        expect(getItemByIdService.get).toHaveBeenCalledOnceWith('item-1');
        done();
      });
    });

    it('should cache and reuse item observables', (done: DoneFn) => {
      getItemByIdService.get.and.returnValue(of(mockItem('Cached')));

      const obs1 = service.resolveItem('item-2');
      const obs2 = service.resolveItem('item-2');

      expect(obs1).toBe(obs2);
      obs2.subscribe(() => {
        expect(getItemByIdService.get).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should cache null on error', (done: DoneFn) => {
      getItemByIdService.get.and.returnValue(throwError(() => new Error('404')));

      service.resolveItem('hidden').subscribe(title => {
        expect(title).toBeNull();
        expect(getItemByIdService.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('prefetchItems', () => {
    it('should trigger resolution for all provided item IDs', () => {
      getItemByIdService.get.and.returnValue(of(mockItem('X')));

      service.prefetchItems([ 'i1', 'i2' ]);

      expect(getItemByIdService.get).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate HTTP calls for already-cached IDs', () => {
      getItemByIdService.get.and.returnValue(of(mockItem('Y')));

      service.prefetchItems([ 'i1' ]);
      service.prefetchItems([ 'i1' ]);

      expect(getItemByIdService.get).toHaveBeenCalledTimes(1);
    });
  });
});
