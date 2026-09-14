import { UrlSegment } from '@angular/router';
import { isItemRouteError, parseItemUrlSegments } from './item-route-serialization';
import { newAttemptId } from './item-route';

describe('parseItemUrlSegments', () => {
  it('keeps parentAttemptId when the URL also has attemptId', () => {
    const segments = [
      new UrlSegment('a', {}),
      new UrlSegment('42', { p: '', a: '7', pa: '0' }),
    ];

    const parsed = parseItemUrlSegments(segments, {});
    expect(parsed).not.toBeNull();
    expect(parsed!.route).toEqual(jasmine.objectContaining({
      contentType: 'activity',
      id: '42',
      path: [],
      attemptId: '7',
      parentAttemptId: '0',
    }));
    expect(parsed!.page).toEqual([]);
  });

  it('parses a URL with only parentAttemptId', () => {
    const segments = [
      new UrlSegment('a', {}),
      new UrlSegment('42', { p: '1', pa: '0' }),
    ];

    const parsed = parseItemUrlSegments(segments, {});
    expect(parsed).not.toBeNull();
    expect(parsed!.route).toEqual(jasmine.objectContaining({
      contentType: 'activity',
      id: '42',
      path: [ '1' ],
      parentAttemptId: '0',
    }));
    expect(parsed!.page).toEqual([]);
  });

  it('accepts a=new together with a parent attempt', () => {
    const segments = [
      new UrlSegment('a', {}),
      new UrlSegment('42', { p: '1', a: newAttemptId, pa: '0' }),
    ];

    const parsed = parseItemUrlSegments(segments, {});
    expect(parsed).not.toBeNull();
    expect(parsed!.route).toEqual(jasmine.objectContaining({
      attemptId: newAttemptId,
      parentAttemptId: '0',
      path: [ '1' ],
    }));
  });

  it('treats a=new without a parent attempt as a route error', () => {
    const segments = [
      new UrlSegment('a', {}),
      new UrlSegment('42', { p: '1', a: newAttemptId }),
    ];

    const parsed = parseItemUrlSegments(segments, {});
    expect(parsed).not.toBeNull();
    expect(isItemRouteError(parsed!.route)).toBeTrue();
    if (isItemRouteError(parsed!.route)) {
      expect(parsed!.route.path).toEqual([ '1' ]);
      expect(parsed!.route.attemptId).toBeUndefined();
    }
  });
});
