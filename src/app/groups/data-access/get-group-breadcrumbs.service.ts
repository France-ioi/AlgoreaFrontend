import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { catchError, map } from 'rxjs/operators';
import { appConfig } from 'src/app/utils/config';
import { groupRoute, GroupRoute } from 'src/app/models/routing/group-route';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { breadcrumbSchema, GroupBreadcrumbs } from '../models/group-breadcrumbs';
import { tagError } from 'src/app/utils/errors';
import { breadcrumbServiceTag } from 'src/app/items/data-access/get-breadcrumb.service';

@Injectable({
  providedIn: 'root'
})
export class GetGroupBreadcrumbsService {

  constructor(private http: HttpClient) {}

  getBreadcrumbs(route: GroupRoute): Observable<GroupBreadcrumbs> {
    const groupIds = [ ...route.path, route.id ];

    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${groupIds.join('/')}/breadcrumbs`).pipe(
      decodeSnakeCaseZod(z.array(breadcrumbSchema)),
      map(breadcrumbs => breadcrumbs.map((breadcrumb, index) => ({
        ...breadcrumb,
        route: groupRoute(breadcrumb, breadcrumbs.slice(0, index).map(({ id }) => id)),
      }))),
      catchError(err => {
        throw tagError(err, breadcrumbServiceTag);
      })
    );
  }

}
