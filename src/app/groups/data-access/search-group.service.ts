import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { z } from 'zod';
import { decodeSnakeCase } from '../../utils/operators/decode';

const groupInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Base', 'Session' ]),
});

export type Group = z.infer<typeof groupInfoSchema>;

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
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  search(
    searchString: string,
    limit = 5,
  ): Observable<GroupFound[]> {
    const params = new HttpParams({ fromObject: { search: searchString, limit: limit.toString() } });
    return this.http.get<unknown>(
      `${this.config.apiUrl}/current-user/available-groups`,
      { params: params },
    ).pipe(
      decodeSnakeCase(z.array(groupInfoSchema)),
      map(groups => groups.filter(notBase)),
    );
  }

  searchPossibleSubgroups(
    searchString: string,
    limit = 11,
  ): Observable<GroupFound[]> {
    const params = new HttpParams({ fromObject: { search: searchString, limit: limit.toString() } });
    return this.http.get<unknown>(
      `${this.config.apiUrl}/groups/possible-subgroups`,
      { params: params },
    ).pipe(
      decodeSnakeCase(z.array(groupInfoSchema)),
      map(groups => groups.filter(notBase))
    );
  }
}
