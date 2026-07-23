import { toArray } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { sentryReporter } from 'src/app/utils/error-handling/error-reporting';
import { fromCurrentContent } from './current-content/current-content.store';
import { trackContentPageViewEffect } from './analytics-tracking.effects';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

describe('trackContentPageViewEffect', () => {
  let captureException: jasmine.Spy;
  let dataLayer: Record<string, unknown>[];

  beforeEach(() => {
    captureException = spyOn(sentryReporter, 'captureException').and.returnValue('event-id');
    dataLayer = [];
    (window as unknown as Record<string, unknown>)['dataLayer'] = dataLayer;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['dataLayer'];
  });

  it('side-effect failure does not kill the stream', done => {
    testScheduler.run(({ hot }) => {
      const actions$ = hot('-ab-|', {
        a: fromCurrentContent.contentPageActions.changeContent({ route: '/a', title: 'Page A' }),
        b: fromCurrentContent.contentPageActions.changeContent({ route: '/b', title: 'Page B' }),
      });

      spyOn(dataLayer, 'push').and.callFake((...items: Record<string, unknown>[]) => {
        if ((dataLayer.push as jasmine.Spy).calls.count() === 1) {
          throw new Error('dataLayer boom');
        }
        return Array.prototype.push.apply(dataLayer, items);
      });

      trackContentPageViewEffect(actions$).pipe(toArray()).subscribe({
        next: () => {
          expect(dataLayer.push).toHaveBeenCalledTimes(2);
          expect(captureException).toHaveBeenCalledTimes(1);
          expect(dataLayer.some(entry => entry['page_title'] === 'Page B')).toBeTrue();
          done();
        },
      });
    });
  });
});
