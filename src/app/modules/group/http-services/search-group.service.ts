import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

interface GroupInfos {
  id: string,
  name: string,
  description: string|null,
}

interface Group extends GroupInfos {
  type: 'Class'|'Team'|'Club'|'Friends'|'Other'|'Base',
}

export interface GroupFound extends GroupInfos {
  type: 'Class'|'Team'|'Club'|'Friends'|'Other',
}

function notBase(group: Group): group is GroupFound {
  return group.type !== 'Base';
}

@Injectable({
  providedIn: 'root'
})
export class SearchGroupService {

  constructor(private http: HttpClient) { }

  search(
    searchString: string,
    limit = 4,
  ): Observable<GroupFound[]> {
    const params = new HttpParams({ fromObject: { search: searchString, limit: limit.toString() } });
    return this.http.get<Group[]>(
      `${appConfig.apiUrl}/current-user/available-groups`,
      { params: params },
    ).pipe(map(groups => groups.filter(notBase)));
  }

  searchPossibleSubgroups(
    searchString: string,
    limit = 4,
  ): Observable<GroupFound[]> {
    const params = new HttpParams({ fromObject: { search: searchString, limit: limit.toString() } });
    return this.http.get<Group[]>(
      `${appConfig.apiUrl}/groups/possible-subgroups`,
      { params: params },
    ).pipe(map(groups => groups.filter(notBase)));
  }
}
