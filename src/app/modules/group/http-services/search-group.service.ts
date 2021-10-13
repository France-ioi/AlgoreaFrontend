import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import * as D from 'io-ts/Decoder';
import { decodeSnakeCase } from '../../../shared/operators/decode';

const groupInfoDecoder = D.struct({
  id: D.string,
  name: D.string,
  description: D.nullable(D.string),
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Base', 'Session'),
});

export type Group = D.TypeOf<typeof groupInfoDecoder>;

export interface GroupFound extends Group {
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
    limit = 5,
  ): Observable<GroupFound[]> {
    const params = new HttpParams({ fromObject: { search: searchString, limit: limit.toString() } });
    return this.http.get<Group[]>(
      `${appConfig.apiUrl}/current-user/available-groups`,
      { params: params },
    ).pipe(
      decodeSnakeCase(D.array(groupInfoDecoder)),
      map(groups => groups.filter(notBase)),
    );
  }

  searchPossibleSubgroups(
    searchString: string,
    limit = 5,
  ): Observable<GroupFound[]> {
    const params = new HttpParams({ fromObject: { search: searchString, limit: limit.toString() } });
    return this.http.get<Group[]>(
      `${appConfig.apiUrl}/groups/possible-subgroups`,
      { params: params },
    ).pipe(
      decodeSnakeCase(D.array(groupInfoDecoder)),
      map(groups => groups.filter(notBase))
    );
  }
}
