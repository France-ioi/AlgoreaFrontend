import { forkJoin, Observable } from 'rxjs';
import { combineLatestWith, map } from 'rxjs/operators';
import { GetGroupChildrenService } from 'src/app/groups/data-access/get-group-children.service';
import { formatUser } from 'src/app/groups/models/user';
import { GetGroupDescendantsService } from 'src/app/data-access/get-group-descendants.service';
import { GetGroupProgressService } from 'src/app/data-access/get-group-progress.service';
import { DataColumn, DataFetching, DataRow, Progress } from './group-progress-grid.types';

function getGroupProgressRows(
  getGroupDescendantsService: GetGroupDescendantsService,
  getGroupChildrenService: GetGroupChildrenService,
  { groupId, filter, pageSize, fromId }: Omit<DataFetching, 'itemId'>,
): Observable<{ id: string, value: string, user?: DataRow['user'] }[]> {
  switch (filter) {
    case 'Users':
      return getGroupDescendantsService.getUserDescendants(groupId, { limit: pageSize, fromId })
        .pipe(map(users => users.map(user => ({ id: user.id, value: formatUser(user.user), user: { ...user.user, id: user.id } }))));
    case 'Teams':
      return getGroupDescendantsService.getTeamDescendants(groupId, { limit: pageSize, fromId })
        .pipe(map(teams => teams.map(team => ({ id: team.id, value: team.name }))));
    case 'Groups':
      return getGroupChildrenService.getGroupChildren(groupId, [], [], [ 'Team', 'User' ], { limit: pageSize, fromId })
        .pipe(map(groups => groups.map(group => ({ id: group.id, value: group.name }))));
  }
}

function getGroupProgress(
  getGroupUsersProgressService: GetGroupProgressService,
  { itemId, groupId, filter, pageSize, fromId }: DataFetching,
): Observable<Progress[]> {
  switch (filter) {
    case 'Users':
      return getGroupUsersProgressService.getUsersProgress(groupId, [ itemId ], { limit: pageSize, fromId }).pipe(
        map(progress => progress.map(p => ({ ...p, type: 'user' }))),
      );
    case 'Teams':
      return getGroupUsersProgressService.getTeamsProgress(groupId, [ itemId ], { limit: pageSize, fromId }).pipe(
        map(progress => progress.map(p => ({ ...p, type: 'user' }))),
      );
    case 'Groups':
      return getGroupUsersProgressService.getGroupsProgress(groupId, [ itemId ], { limit: pageSize, fromId })
        .pipe(map(groupsProgress => groupsProgress.map(p => ({
          type: 'group',
          groupId: p.groupId,
          itemId: p.itemId,
          validationRate: p.validationRate,
          score: p.averageScore,
          timeSpent: p.avgTimeSpent,
          hintsRequested: p.avgHintsRequested,
          submissions: p.avgSubmissions,
          latestActivityAt: null,
        }))));
  }
}

export function getRowsWithProgress(
  getGroupDescendantsService: GetGroupDescendantsService,
  getGroupChildrenService: GetGroupChildrenService,
  getGroupUsersProgressService: GetGroupProgressService,
  columns$: Observable<DataColumn[]>,
  fetching: DataFetching,
): Observable<DataRow[]> {
  return forkJoin({
    rows: getGroupProgressRows(getGroupDescendantsService, getGroupChildrenService, fetching),
    progress: getGroupProgress(getGroupUsersProgressService, fetching),
  }).pipe(
    combineLatestWith(columns$),
    map(([{ rows, progress }, items ]) =>
      rows
        .filter(row => progress.find(p => p.groupId === row.id))
        .map(row => ({
          header: row.value,
          id: row.id,
          user: row.user,
          data: items.map(item =>
            progress.find(p => p.itemId === item.id && p.groupId === row.id)
          ),
        })),
    )
  );
}
