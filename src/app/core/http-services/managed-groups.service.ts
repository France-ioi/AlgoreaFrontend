import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';

export interface Group {
  id: string,
  name: string
}

interface ManagedGroup{
  id: string,
  name: string
}

@Injectable({
  providedIn: 'root'
})
export class ManagedGroupsService {

  constructor(private http: HttpClient) {}

  getManagedGroups(): Observable<Group[]> {
    return this.http
      .get<ManagedGroup[]>(`${appConfig().apiUrl}/current-user/managed-groups`)
      .pipe(
        // convert array of ManagedGroup to array of Group (exported type)
        map(gs =>
          gs.map(g => ({ id: g.id, name: g.name }))
        )
      );
  }

}


