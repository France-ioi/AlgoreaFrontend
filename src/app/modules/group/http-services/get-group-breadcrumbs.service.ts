import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as D from 'io-ts/Decoder';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { groupRoute, GroupRoute } from 'src/app/shared/routing/group-route';
import { decodeSnakeCase } from 'src/app/shared/operators/decode';

const breadcrumbDecoder = D.struct({
  id: D.string,
  name: D.string,
  type: D.literal('Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base'),
});

type Breadcrumb = D.TypeOf<typeof breadcrumbDecoder>;

export interface GroupBreadcrumb extends Breadcrumb {
  route: GroupRoute,
}

@Injectable({
  providedIn: 'root'
})
export class GetGroupBreadcrumbsService {

  constructor(private http: HttpClient) {}

  getBreadcrumbs(route: GroupRoute): Observable<GroupBreadcrumb[]> {
    const groupIds = [ ...route.path, route.id ];

    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${groupIds.join('/')}/breadcrumbs`).pipe(
      decodeSnakeCase(D.array(breadcrumbDecoder)),
      map(breadcrumbs => breadcrumbs.map((breadcrumb, index) => ({
        ...breadcrumb,
        route: groupRoute(breadcrumb, breadcrumbs.slice(0, index).map(({ id }) => id)),
      }))),
    );
  }

}
