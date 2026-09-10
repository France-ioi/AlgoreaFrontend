import {
  FullItemRoute,
  itemRoute,
  parentRoute,
  routeWithSelfAttempt,
  resultsFetchKey,
} from './item-route';

describe('routeWithSelfAttempt', () => {
  const routeWithParent = itemRoute('activity', '1', { path: [], parentAttemptId: '0' });
  const routeWithSelf = itemRoute('activity', '1', { path: [], attemptId: 'old', parentAttemptId: '0' });

  it('should add the attempt id when the route only has a parent attempt', () => {
    expect(routeWithSelfAttempt(routeWithParent, '42')).toEqual({ ...routeWithParent, attemptId: '42' });
  });

  it('should replace an existing self attempt id', () => {
    expect(routeWithSelfAttempt(routeWithSelf, '99')).toEqual({ ...routeWithSelf, attemptId: '99' });
  });

  it('should leave the route unchanged when attempt id is undefined', () => {
    expect(routeWithSelfAttempt(routeWithSelf, undefined)).toBe(routeWithSelf);
    expect(routeWithSelfAttempt(routeWithParent, undefined)).toBe(routeWithParent);
  });
});

describe('resultsFetchKey', () => {
  const base = { path: [ '1' ] as string[], parentAttemptId: '0' };

  it('drops the self attempt when a parent attempt is present', () => {
    const parentOnly = itemRoute('activity', '2', { ...base });
    const withSelf = itemRoute('activity', '2', { ...base, attemptId: '42' });
    expect(resultsFetchKey(parentOnly)).toEqual(resultsFetchKey(withSelf));
    expect(resultsFetchKey(withSelf).attemptId).toBeUndefined();
  });

  it('shares a key for two self attempts under the same parent', () => {
    const a = itemRoute('activity', '2', { ...base, attemptId: '42' });
    const b = itemRoute('activity', '2', { ...base, attemptId: '99' });
    expect(resultsFetchKey(a)).toEqual(resultsFetchKey(b));
  });

  it('keeps distinct keys for self attempts without a parent', () => {
    const a = itemRoute('activity', '2', { path: [ '1' ], attemptId: '42' });
    const b = itemRoute('activity', '2', { path: [ '1' ], attemptId: '99' });
    expect(resultsFetchKey(a)).not.toEqual(resultsFetchKey(b));
    expect(resultsFetchKey(a).attemptId).toBe('42');
  });

  it('keeps distinct keys for different parent attempts', () => {
    const a = itemRoute('activity', '2', { path: [ '1' ], parentAttemptId: '0' });
    const b = itemRoute('activity', '2', { path: [ '1' ], parentAttemptId: '1' });
    expect(resultsFetchKey(a)).not.toEqual(resultsFetchKey(b));
  });

  it('ignores answer in the key', () => {
    const a = itemRoute('activity', '2', { ...base, answer: { id: 'ans-1' } });
    const b = itemRoute('activity', '2', { ...base, answer: { id: 'ans-2' } });
    expect(resultsFetchKey(a)).toEqual(resultsFetchKey(b));
  });

  it('ignores contentType in the key', () => {
    const a = itemRoute('activity', '2', { ...base });
    const b = itemRoute('skill', '2', { ...base });
    expect(resultsFetchKey(a)).toEqual(resultsFetchKey(b));
  });

  it('keeps distinct keys for different observed groups', () => {
    const a = itemRoute('activity', '2', { ...base, observedGroup: { id: 'g1', isUser: false } });
    const b = itemRoute('activity', '2', { ...base, observedGroup: { id: 'g2', isUser: false } });
    expect(resultsFetchKey(a)).not.toEqual(resultsFetchKey(b));
  });
});

describe('parentRoute', () => {
  const mockDefaultActivityId = '100';
  const mockDefaultActivityRoute: FullItemRoute = itemRoute(
    'activity',
    mockDefaultActivityId,
    { path: [], parentAttemptId: 'defaultAttId' }
  );

  it('should return the default route if the path is empty', () => {
    expect(
      parentRoute(itemRoute('activity','999',{ path: [] }), mockDefaultActivityRoute).id
    ).toEqual(
      mockDefaultActivityId
    );
  });

  it('should return an activity with no attempt, for an activity with a self attempt', () => {
    expect(
      parentRoute(itemRoute('activity','4', { attemptId: '1', path: ['1', '2', '3'] }), mockDefaultActivityRoute)
    ).toEqual(
      itemRoute('activity','3',{ path: ['1', '2'], attemptId: undefined })
    );
  });

  it('should return a skill with no attempt for a skill with no attempt', () => {
    expect(
      parentRoute(itemRoute('skill','4',{ path: ['1', '2', '3'] }), mockDefaultActivityRoute)
    ).toEqual(
      itemRoute('skill','3',{ path: ['1', '2'], attemptId: undefined })
    );
  });

  it('should return an activity with a self attempt for an activity with a parent attempt', () => {
    expect(
      parentRoute(itemRoute('activity','4', { parentAttemptId: '1', path: ['1', '2', '3'] }), mockDefaultActivityRoute)
    ).toEqual(
      itemRoute('activity','3',{ path: ['1', '2'], attemptId: '1' })
    );
  });

});
