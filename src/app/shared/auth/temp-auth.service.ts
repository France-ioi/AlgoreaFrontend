import { Injectable } from '@angular/core';
import { AuthHttpService } from '../http-services/auth.http-service';
import { AccessToken } from './access-token';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TempAuthService {

  constructor(private authHttp: AuthHttpService) { }

  // Create a temp user and use its token for authentication.
  // The temp user should not have a valid access token before the call.
  // The observable may fail is the backend request fails.
  login(): Observable<AccessToken> {
    return this.authHttp.createTempUser().pipe(
      map(t => AccessToken.fromTTL(t.access_token, t.expires_in, 'temporary'))
    );
  }

}
