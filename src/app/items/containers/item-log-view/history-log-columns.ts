import { ItemType } from 'src/app/items/models/item-type';
import { RawGroupRoute, isUser } from 'src/app/models/routing/group-route';

export interface HistoryLogColumn {
  field: string,
  header: string,
}

export function historyLogColumns(type: ItemType, observedGroupRoute: RawGroupRoute | null): HistoryLogColumn[] {
  return [
    { field: 'activityType', header: $localize`Action`, enabled: true },
    { field: 'item.string.title', header: $localize`Content`, enabled: type !== 'Task' },
    { field: 'item.user', header: $localize`User`, enabled: !!(observedGroupRoute && !isUser(observedGroupRoute)) },
    { field: 'at', header: $localize`Time`, enabled: true },
  ].filter(item => item.enabled).map(({ field, header }) => ({ field, header }));
}
