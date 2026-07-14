import { formatBreadcrumbs } from './group-breadcrumbs';
import { GroupRouter } from 'src/app/models/routing/group-router';

describe('group-breadcrumbs', () => {
  const groupRouter = { navigateTo: jasmine.createSpy('navigateTo') } as unknown as GroupRouter;

  it('should add the group icon only on the last breadcrumb', () => {
    const breadcrumbs = formatBreadcrumbs([
      {
        id: 'parent',
        name: 'Parent group',
        type: 'Class',
        route: { id: 'parent', path: [], contentType: 'group' },
      },
      {
        id: 'current',
        name: 'Current group',
        type: 'Team',
        route: { id: 'current', path: [ 'parent' ], contentType: 'group' },
      },
    ], groupRouter);

    expect(breadcrumbs[0]!.icon).toBeUndefined();
    expect(breadcrumbs[1]!.icon).toBe('ph-users-three');
  });
});
