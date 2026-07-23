import { toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { sentryReporter } from '../error-handling/error-reporting';
import { runSideEffectSafely } from './run-side-effect-safely';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

describe('runSideEffectSafely', () => {
  let captureException: jasmine.Spy;

  beforeEach(() => {
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
  });

  it('reports consecutive failures then processes a later success', done => {
    testScheduler.run(({ hot }) => {
      const values: string[] = [];
      const sideEffect = jasmine.createSpy('sideEffect').and.callFake((v: string) => {
        if (v === 'a' || v === 'b') {
          throw new Error(`fail ${v}`);
        }
        values.push(v);
      });

      hot('-a-b-c-|', { a: 'a', b: 'b', c: 'c' }).pipe(
        runSideEffectSafely(sideEffect),
        toArray(),
      ).subscribe({
        next: emitted => {
          expect(emitted).toEqual([ 'c' ]);
          expect(values).toEqual([ 'c' ]);
          expect(sideEffect).toHaveBeenCalledTimes(3);
          expect(captureException).toHaveBeenCalledTimes(2);
          done();
        },
      });
    });
  });
});
