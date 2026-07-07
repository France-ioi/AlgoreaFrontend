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

const descendantUsersColumns: Column[] = [
  { field: 'user.login', header: $localize`Name` },
  { field: 'parentGroups', header: $localize`Parent group(s)` },
];

export function getColumns(variant: 'users' | 'groups', directChildren: boolean): Column[] {
  if (variant === 'groups') {
    return groupsColumns;
  }
  return directChildren ? usersColumns : descendantUsersColumns;
}
