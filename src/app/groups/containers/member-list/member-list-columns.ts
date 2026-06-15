import { Filter, TypeFilter } from '../group-composition-filter/group-composition-filter.component';

export interface Column {
  sortable?: boolean,
  field: string,
  header: string,
}

const usersColumns: Column[] = [
  { field: 'user.login', header: $localize`Name`, sortable: true },
  { field: 'member_since', header: $localize`Member Since`, sortable: true },
];

const groupsColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'type', header: $localize`Type` },
  { field: 'userCount', header: $localize`User Count` },
];

const nameUserCountColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'userCount', header: $localize`User Count` },
];

const descendantUsersColumns: Column[] = [
  { field: 'user.login', header: $localize`Name` },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
];

const descendantTeamsColumns: Column[] = [
  { field: 'name', header: $localize`Name`, sortable: true },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
  { field: 'members', header: $localize`Member(s)` },
];

export function getColumns(filter: Filter): Column[] {
  switch (filter.type) {
    case TypeFilter.Groups: return groupsColumns;
    case TypeFilter.Sessions: return nameUserCountColumns;
    case TypeFilter.Teams: return filter.directChildren ? nameUserCountColumns : descendantTeamsColumns;
    case TypeFilter.Users: return filter.directChildren ? usersColumns : descendantUsersColumns;
  }
}
