import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from '../helpers/config';

interface RawUserProfile {
  group_id: string,
  first_name: string|null,
  last_name: string|null,
  login: string,
  default_language: string,
  temp_user: boolean,
  time_zone: string|null,
}

export interface UserProfile {
  id: string,
  login: string
  firstName: string|null,
  lastName: string|null,
  isTemp: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserHttpService {

  constructor(private http: HttpClient) {}

  getProfileInfo(): Observable<UserProfile> {
    return this.http
      .get<RawUserProfile>(`${appConfig().apiUrl}/current-user`)
      .pipe(
        map(raw => ({
          id: raw.group_id,
          login: raw.login,
          firstName: raw.first_name,
          lastName: raw.last_name,
          isTemp: raw.temp_user,
        }))
      );
  }

}
