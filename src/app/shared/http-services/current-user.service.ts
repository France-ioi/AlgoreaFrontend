import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

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
  firstname: string|null,
  lastname: string|null,
  isTemp: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserHttpService {

  constructor(private http: HttpClient) {}

  getProfileInfo(): Observable<UserProfile> {
    return this.http
      .get<RawUserProfile>(`${environment.apiUrl}/current-user`)
      .pipe(
        map((raw) => ({
          id: raw.group_id,
          login: raw.login,
          firstname: raw.first_name,
          lastname: raw.last_name,
          isTemp: raw.temp_user,
        }))
      );
  }

}
