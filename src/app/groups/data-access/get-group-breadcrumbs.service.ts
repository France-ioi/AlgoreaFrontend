import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { catchError, map } from 'rxjs/operators';
import { APPCONFIG } from 'src/app/app.config';
import { inject } from '@angular/core';
import { groupRoute, GroupRoute } from 'src/app/models/routing/group-route';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { breadcrumbSchema, GroupBreadcrumbs } from '../models/group-breadcrumbs';
import { tagError } from 'src/app/utils/errors';
import { breadcrumbServiceTag } from 'src/app/items/data-access/get-breadcrumb.service';

@Injectable({
  providedIn: 'root'
})
export class GetGroupBreadcrumbsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getBreadcrumbs(route: GroupRoute): Observable<GroupBreadcrumbs> {
    const groupIds = [ ...route.path, route.id ];

    return this.http.get<unknown>(`${this.config.apiUrl}/groups/${groupIds.join('/')}/breadcrumbs`).pipe(
      decodeSnakeCase(z.array(breadcrumbSchema)),
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
