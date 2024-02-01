import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as D from 'io-ts/Decoder';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/utils/config';
import { groupRoute, GroupRoute } from 'src/app/models/routing/group-route';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { breadcrumbDecoder, GroupBreadcrumbs } from '../models/group-breadcrumbs';

@Injectable({
  providedIn: 'root'
})
export class GetGroupBreadcrumbsService {

  constructor(private http: HttpClient) {}

  getBreadcrumbs(route: GroupRoute): Observable<GroupBreadcrumbs> {
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
