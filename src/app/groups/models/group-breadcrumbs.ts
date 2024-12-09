import { z } from 'zod';
import { GroupRoute } from 'src/app/models/routing/group-route';

export const breadcrumbSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.union([
    z.literal('Class'),
    z.literal('Team'),
    z.literal('Club'),
    z.literal('Friends'),
    z.literal('Other'),
    z.literal('User'),
    z.literal('Session'),
    z.literal('Base'),
  ]),
});

interface GroupBreadcrumb extends z.infer<typeof breadcrumbSchema> {
  route: GroupRoute,
}

export type GroupBreadcrumbs = GroupBreadcrumb[];
