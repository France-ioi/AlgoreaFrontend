import { UrlTree } from '@angular/router';
import { z } from 'zod/v4';
import { ContentBreadcrumbs } from 'src/app/models/content/content-breadcrumbs';
import { GroupRoute } from 'src/app/models/routing/group-route';
import { GroupRouter } from 'src/app/models/routing/group-router';

export const breadcrumbSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base' ]),
});

interface GroupBreadcrumb extends z.infer<typeof breadcrumbSchema> {
  route: GroupRoute,
}

export type GroupBreadcrumbs = GroupBreadcrumb[];

export function formatBreadcrumbs(breadcrumbs: GroupBreadcrumbs, groupRouter: GroupRouter): ContentBreadcrumbs {
  return breadcrumbs.map(breadcrumb => ({
    title: breadcrumb.name,
    navigateTo: (): UrlTree => groupRouter.url(breadcrumb.route),
  }));
}
