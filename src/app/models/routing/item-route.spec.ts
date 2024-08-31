import { appConfig } from 'src/app/utils/config';
import { itemRoute, parentRoute } from './item-route';

describe('parentRoute', () => {
  it('should return the default route if the path is empty', () => {
    expect(
      parentRoute(itemRoute('activity','999',{ path: [] })).id
    ).toEqual(
      appConfig.defaultActivityId
    );
  });

  it('should return an activity with no attempt, for an activity with a self attempt', () => {
    expect(
      parentRoute(itemRoute('activity','4', { attemptId: '1', path: ['1', '2', '3'] }))
    ).toEqual(
      itemRoute('activity','3',{ path: ['1', '2'], attemptId: undefined })
    );
  });

  it('should return a skill with no attempt for a skill with no attempt', () => {
    expect(
      parentRoute(itemRoute('skill','4',{ path: ['1', '2', '3'] }))
    ).toEqual(
      itemRoute('skill','3',{ path: ['1', '2'], attemptId: undefined })
    );
  });

  it('should return an activity with a self attempt for an activity with a parent attempt', () => {
    expect(
      parentRoute(itemRoute('activity','4', { parentAttemptId: '1', path: ['1', '2', '3'] }))
    ).toEqual(
      itemRoute('activity','3',{ path: ['1', '2'], attemptId: '1' })
    );
  });

});
