import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { ensureDefined } from '../helpers/null-undefined-predicates';
import { retryAfter } from './retry-after';

describe('retryAfter operator', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should not retry with source not emitting errors', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source = cold('--1--1-|');
      expectObservable(source.pipe(retryAfter({ maxAttempts: 3, delay: 100 }))).toEqual(source);
    });
  });

  it('should retry twice after 20ms and 40ms then throw error', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source = cold('  --#').pipe(retryAfter({ delay: 20, maxAttempts: 2 }));
      const expected = cold('-- 20ms -- 20ms --#');
      expectObservable(source).toEqual(expected);
    });
  });

  it('should retry twice after 10ms and not a third time because it succeeded', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const sources: Record<number, Observable<string>> = {
        1: cold('---#'),
        2: cold('------#'),
        3: cold('-a'),
      };
      let count = 0;
      const source = cold('x').pipe(
        switchMap(() => ensureDefined(sources[++count])),
        retryAfter({ delay: 10, maxAttempts: 10 }),
      );
      const expected = cold('--- 10ms ------ 10ms -a');
      //           1st source^     2nd^        3rd^
      expectObservable(source).toEqual(expected);
    });
  });
});
