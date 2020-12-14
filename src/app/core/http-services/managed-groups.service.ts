import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

export interface Group {
  id: string,
  name: string
  canWatchMember: boolean
}

interface RawGroup {
  id: string,
  name: string,
  can_watch_members: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class ManagedGroupsService {

  constructor(private http: HttpClient) {}

  getManagedGroups(): Observable<Group[]> {
    return this.http
      .get<RawGroup[]>(`${appConfig().apiUrl}/current-user/managed-groups`)
      .pipe(
        map(groups =>
          groups.map(g => ({
            id: g.id,
            name: g.name,
            canWatchMember: g.can_watch_members
          }))
        )
      );
  }

}


