import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from 'src/app/shared/helpers/config';
import { ActionResponse, objectToMap, successData } from 'src/app/shared/http-services/action-response';

@Injectable({
  providedIn: 'root'
})
export class GroupUsersService {

  constructor(private http: HttpClient) {}

  removeUsers(groupId: string, usersId: string[]): Observable<Map<string, any>> {
    const httpParams = new HttpParams().set('user_ids', usersId.join(','));
    return this.http.delete<ActionResponse<Object>>(`${appConfig().apiUrl}/groups/${groupId}/members`, {
      params: httpParams
    }).pipe(
      map(successData),
      map(objectToMap)
    );
  }
}
