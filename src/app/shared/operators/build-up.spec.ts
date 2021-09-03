/* eslint-disable no-multi-spaces */
import { EMPTY, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { buildUp } from './build-up';

describe('buildUp operator', () => {

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should work as expected when the second service responds immediately', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source =   cold('---a------b---|', { a: { name: 'foo', childId: '4' }, b: { name: 'bar', childId: '6' } });
      const expected = cold('---(xy)---(wz)|', {
        x: { name: 'foo', childId: '4' },
        y: { name: 'foo', childId: '4', childName: 'foo4' },
        w: { name: 'bar', childId: '6' },
        z: { name: 'bar', childId: '6', childName: 'bar6' },
      });
      const list = source.pipe(buildUp(s => of({ childName: s.name + s.childId })));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should work as expected when the second service responds with a delay', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source =   cold('---a------b---|', { a: { name: 'foo', childId: '4' }, b: { name: 'bar', childId: '6' } });
      const expected = cold('---x-y----w-z-|', {
        x: { name: 'foo', childId: '4' },
        y: { name: 'foo', childId: '4', childName: 'foo4' },
        w: { name: 'bar', childId: '6' },
        z: { name: 'bar', childId: '6', childName: 'bar6' },
      });
      const list = source.pipe(buildUp(s => of({ childName: s.name + s.childId }).pipe(delay(2))));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should work as expected when the second call is cancelled by another emission from the source', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source =   cold('---a--b-----|', { a: { name: 'foo', childId: '4' }, b: { name: 'bar', childId: '6' } });
      const expected = cold('---x--w---z-|', {
        x: { name: 'foo', childId: '4' },
        w: { name: 'bar', childId: '6' },
        z: { name: 'bar', childId: '6', childName: 'bar6' },
      });
      const list = source.pipe(buildUp(s => of({ childName: s.name + s.childId }).pipe(delay(4))));
      expectObservable(list).toEqual(expected);
    });
  });


  it('should work as expected when the second service complete immediately', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source =   cold('---a------b---|', { a: { name: 'foo', childId: '4' }, b: { name: 'bar', childId: '6' } });
      const expected = cold('---x------w---|', {
        x: { name: 'foo', childId: '4' },
        w: { name: 'bar', childId: '6' },
      });
      const list = source.pipe(buildUp(_ => EMPTY));
      expectObservable(list).toEqual(expected);
    });
  });

  it('should work as expected when keys are overridden', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const source =   cold('---a------b---|', { a: { name: 'foo', childId: '4' }, b: { name: 'bar', childId: '6' } });
      const expected = cold('---(xy)---(wz)|', {
        x: { name: 'foo', childId: '4' },
        y: { name: 'foo4', childId: '4' },
        w: { name: 'bar', childId: '6' },
        z: { name: 'bar6', childId: '6' },
      });
      const list = source.pipe(buildUp(s => of({ name: s.name + s.childId })));
      expectObservable(list).toEqual(expected);
    });
  });

});
