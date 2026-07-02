import { delay, forkJoin, of, Subject, throwError } from 'rxjs';
import { createResolutionCache } from './resolution-cache';

describe('createResolutionCache', () => {
  describe('get', () => {
    it('should resolve each ID once and cache separately', (done: DoneFn) => {
      const resolve = jasmine.createSpy('resolve').and.callFake((id: string) => of(`value-${ id }`));
      const cache = createResolutionCache<string>(resolve);

      forkJoin([ cache.get('a'), cache.get('b') ]).subscribe(([ a, b ]) => {
        expect(a).toBe('value-a');
        expect(b).toBe('value-b');
        expect(resolve).toHaveBeenCalledTimes(2);
        done();
      });
    });

    it('should return the same observable on second get for the same ID', (done: DoneFn) => {
      const resolve = jasmine.createSpy('resolve').and.returnValue(of('cached'));
      const cache = createResolutionCache<string>(resolve);

      const obs1 = cache.get('id-1');
      const obs2 = cache.get('id-1');

      expect(obs1).toBe(obs2);
      obs2.subscribe(value => {
        expect(value).toBe('cached');
        expect(resolve).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should call resolve only once for concurrent get() before the source emits', (done: DoneFn) => {
      const subject = new Subject<string>();
      const resolve = jasmine.createSpy('resolve').and.returnValue(subject.asObservable());
      const cache = createResolutionCache<string>(resolve);

      const obs1 = cache.get('concurrent');
      const obs2 = cache.get('concurrent');

      expect(obs1).toBe(obs2);
      expect(resolve).toHaveBeenCalledTimes(1);

      let completed = 0;
      const onValue = (value: string | null): void => {
        expect(value).toBe('done');
        completed++;
        if (completed === 2) {
          expect(resolve).toHaveBeenCalledTimes(1);
          done();
        }
      };

      obs1.subscribe(onValue);
      obs2.subscribe(onValue);
      subject.next('done');
      subject.complete();
    });

    it('should call resolve only once when get() is invoked twice on a delayed source', () => {
      const resolve = jasmine.createSpy('resolve').and.returnValue(of('delayed').pipe(delay(50)));
      const cache = createResolutionCache<string>(resolve);

      cache.get('slow').subscribe();
      cache.get('slow').subscribe();

      expect(resolve).toHaveBeenCalledTimes(1);
    });

    it('should cache null on error', (done: DoneFn) => {
      const resolve = jasmine.createSpy('resolve').and.returnValue(throwError(() => new Error('404')));
      const cache = createResolutionCache<string>(resolve);

      cache.get('hidden').subscribe(value => {
        expect(value).toBeNull();
        expect(resolve).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('prefetch', () => {
    it('should trigger resolution for all provided IDs', () => {
      const resolve = jasmine.createSpy('resolve').and.returnValue(of('x'));
      const cache = createResolutionCache<string>(resolve);

      cache.prefetch([ 'i1', 'i2' ]);

      expect(resolve).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate resolve calls for already-cached IDs', () => {
      const resolve = jasmine.createSpy('resolve').and.returnValue(of('y'));
      const cache = createResolutionCache<string>(resolve);

      cache.prefetch([ 'i1' ]);
      cache.prefetch([ 'i1' ]);

      expect(resolve).toHaveBeenCalledTimes(1);
    });
  });
});
