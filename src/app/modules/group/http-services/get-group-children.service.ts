import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

type GroupType = 'Class'|'Team'|'Club'|'Friends'|'Other'|'User'|'Session'|'Base';

interface RawGroupChild {
  id: string,
  name: string,
  type: GroupType,
  user_count: number,
}

export interface GroupChild {
  id: string,
  name: string,
  type: GroupType,
  userCount: number,
}

@Injectable({
  providedIn: 'root'
})
export class GetGroupChildrenService {

  constructor(private http: HttpClient) { }

  getGroupChildren(
    groupId: string,
    sort: string[] = [],
    typesInclude: GroupType[] = [],
    typesExclude: GroupType[] = [],
  ): Observable<GroupChild[]> {
    let params = new HttpParams();
    if (sort.length > 0) params = params.set('sort', sort.join(','));
    if (typesInclude.length > 0) params = params.set('types_include', typesInclude.join(','));
    if (typesExclude.length > 0) params = params.set('types_exclude', typesExclude.join(','));
    return this.http
      .get<RawGroupChild[]>(`${appConfig.apiUrl}/groups/${groupId}/children`, { params: params })
      .pipe(
        map(rawGroupChildren => rawGroupChildren.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          userCount: c.user_count,
        })))
      );
  }
}
