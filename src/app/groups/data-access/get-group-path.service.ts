import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { z } from 'zod/v4';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { GroupId, GroupPath } from 'src/app/models/ids';

const groupPathResponseSchema = z.object({
  path: z.array(z.string()),
});

@Injectable({
  providedIn: 'root'
})
export class GetGroupPathService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getGroupPath(groupId: GroupId): Observable<GroupPath> {
    return this.http.get<unknown>(`${this.config.apiUrl}/groups/${groupId}/path-from-root`).pipe(
      decodeSnakeCase(groupPathResponseSchema),
      // remove the last element from the path as it is the group id itself, that we do not need in our group paths
      map(raw => raw.path.slice(0,-1)),
    );
  }

}
