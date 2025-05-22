import { FullItemRoute, itemRoute, parentRoute } from './item-route';

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
