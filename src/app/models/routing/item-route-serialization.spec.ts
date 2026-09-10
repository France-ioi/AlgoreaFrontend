import { UrlSegment } from '@angular/router';
import { parseItemUrlSegments } from './item-route-serialization';

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
});
