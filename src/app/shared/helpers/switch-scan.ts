/* eslint-disable */
// Code from RxJS 7 which is still in beta for now. As soon as a stable version has been release, we
// should use the official version instead.

import { Observable, ObservableInput, ObservedValueOf, OperatorFunction, Subscriber } from 'rxjs';
import { switchMap } from 'rxjs/operators';

function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

/**
 * Used to determine if an object is an Observable with a lift function.
 */
function hasLift(source: any): source is { lift: InstanceType<typeof Observable>['lift'] } {
  return isFunction(source?.lift);
}

/**
 * Creates an `OperatorFunction`. Used to define operators throughout the library in a concise way.
 * @param init The logic to connect the liftedSource to the subscriber at the moment of subscription.
 */
function operate<T, R>(
  init: (liftedSource: Observable<T>, subscriber: Subscriber<R>) => (() => void) | void
): OperatorFunction<T, R> {
  return (source: Observable<T>) => {
    if (hasLift(source)) {
      return source.lift(function (this: Subscriber<R>, liftedSource: Observable<T>) {
        try {
          return init(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    }
    throw new TypeError('Unable to lift unknown Observable type');
  };
}

/**
 * Applies an accumulator function over the source Observable where the
 * accumulator function itself returns an Observable, emitting values
 * only from the most recently returned Observable.
 *
 * <span class="informal">It's like {@link scan}, but only the most recent
 * Observable returned by the accumulator is merged into the outer Observable.</span>
 *
 * @see {@link scan}
 * @see {@link mergeScan}
 * @see {@link switchMap}
 *
 * @param accumulator
 * The accumulator function called on each source value.
 * @param seed The initial accumulation value.
 * @return An observable of the accumulated values.
 */
export function switchScan<T, R, O extends ObservableInput<any>>(
  accumulator: (acc: R, value: T, index: number) => O,
  seed: R
): OperatorFunction<T, ObservedValueOf<O>> {
  return operate((source, subscriber) => {
    // The state we will keep up to date to pass into our
    // accumulator function at each new value from the source.
    let state = seed;

    // Use `switchMap` on our `source` to do the work of creating
    // this operator. Note the backwards order here of `switchMap()(source)`
    // to avoid needing to use `pipe` unnecessarily
    switchMap(
      // On each value from the source, call the accumulator with
      // our previous state, the value and the index.
      (value: T, index) => accumulator(state, value, index),
      // Using the deprecated result selector here as a dirty trick
      // to update our state with the flattened value.
      (_, innerValue) => ((state = innerValue), innerValue)
    )(source).subscribe(subscriber);

    return () => {
      // Release state on teardown
      state = null!;
    };
  });
}
