import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

export interface GroupFound<Types> {
  id: string,
  name: string,
  description: string|null,
  type: Types,
}

function notBase(group: GroupFound<'Class'|'Team'|'Club'|'Friends'|'Other'|'Base'>):
  group is GroupFound<'Class'|'Team'|'Club'|'Friends'|'Other'> {
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
  ): Observable<GroupFound<'Class'|'Team'|'Club'|'Friends'|'Other'>[]> {
    const params = new HttpParams({ fromObject: { search: searchString, limit: limit.toString() } });
    return this.http.get<GroupFound<'Class'|'Team'|'Club'|'Friends'|'Other'|'Base'>[]>(
      `${appConfig().apiUrl}/current-user/available-groups`,
      { params: params },
    ).pipe(map(groups => groups.filter(notBase)));
  }
}
