import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as D from 'io-ts/Decoder';
import { appConfig } from 'src/app/shared/helpers/config';
import { GroupRoute } from 'src/app/shared/routing/group-route';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

const groupBreadcrumbDecoder = D.struct({
  id: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base'),
});
export type GroupBreadcrumb = D.TypeOf<typeof groupBreadcrumbDecoder>;

@Injectable({
  providedIn: 'root'
})
export class GetGroupBreadcrumbsService {

  constructor(private http: HttpClient) {}

  getBreadcrumbs(groupRoute: GroupRoute): Observable<GroupBreadcrumb[]> {
    const groupIds = [ ...groupRoute.path, groupRoute.id ];

    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${groupIds.join('/')}/breadcrumbs`).pipe(
      decodeSnakeCase(D.array(groupBreadcrumbDecoder)),
    );
  }

}
