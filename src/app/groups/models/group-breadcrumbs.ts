import { UrlTree } from '@angular/router';
import * as D from 'io-ts/Decoder';
import { ContentBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { GroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';

export const breadcrumbDecoder = D.struct({
  id: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base'),
});

interface GroupBreadcrumb extends D.TypeOf<typeof breadcrumbDecoder> {
  route: GroupRoute,
}

export type GroupBreadcrumbs = GroupBreadcrumb[];

export function formatBreadcrumbs(breadcrumbs: GroupBreadcrumbs, groupRouter: GroupRouter): ContentBreadcrumbs {
  return breadcrumbs.map(breadcrumb => ({
    title: breadcrumb.name,
    navigateTo: (): UrlTree => groupRouter.url(breadcrumb.route),
  }));
}
