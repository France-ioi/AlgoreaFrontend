import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

type GroupId = string;
type GroupPath = GroupId[];
interface RawGroupPath { path: GroupPath }

@Injectable({
  providedIn: 'root'
})
export class GetGroupPathService {

  constructor(private http: HttpClient) {}

  getGroupPath(groupId: GroupId): Observable<GroupPath> {
    return this.http.get<RawGroupPath>(`${environment.apiUrl}/groups/${groupId}/path-from-root`).pipe(
      // remove the last element from the path as it is the group id itself, that we do not need in our group paths
      map(raw => raw.path.slice(0,-1))
    );
  }

}
