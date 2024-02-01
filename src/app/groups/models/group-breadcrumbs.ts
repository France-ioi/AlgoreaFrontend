import * as D from 'io-ts/Decoder';
import { GroupRoute } from 'src/app/models/routing/group-route';

export const breadcrumbDecoder = D.struct({
  id: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base'),
});

interface GroupBreadcrumb extends D.TypeOf<typeof breadcrumbDecoder> {
  route: GroupRoute,
}

export type GroupBreadcrumbs = GroupBreadcrumb[];
