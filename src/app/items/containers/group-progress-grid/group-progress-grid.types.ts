import { UserBaseWithId } from 'src/app/groups/models/user';
import { ItemType } from 'src/app/items/models/item-type';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { RawGroupRoute } from 'src/app/models/routing/group-route';
import { TypeFilter } from '../../models/composition-filter';

export type Progress = {
  groupId: string,
  itemId: string,
  score: number,
  timeSpent: number,
  hintsRequested: number,
  submissions: number,
  latestActivityAt: Date | null,
} & ({
  type: 'user',
  validated: boolean,
} | {
  type: 'group',
  validationRate: number,
});

export interface DataRow {
  header: string,
  id: string,
  user?: UserBaseWithId,
  data: (Progress|undefined)[],
}

export interface DataColumn {
  id: string,
  requiresExplicitEntry: boolean,
  title: string|null,
  type: ItemType,
  permissions: ItemCorePerm,
}

export interface DataFetching {
  groupId: string,
  itemId: string,
  filter: TypeFilter,
  fromId?: string,
  pageSize: number,
}

export interface ProgressDataDialog {
  item: {
    id: string,
    requiresExplicitEntry: boolean,
    string: {
      title: string | null,
    },
  },
  group: RawGroupRoute,
  groupName: string,
  sourceGroupName: string,
}
