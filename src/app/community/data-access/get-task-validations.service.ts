import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { APPCONFIG } from '../../config';
import { decodeSnakeCase } from '../../utils/operators/decode';
import { IdentityTokenService } from '../../services/auth/identity-token.service';
import { RawTaskValidation, taskValidationsResponseSchema } from '../models/task-validation';

@Injectable({
  providedIn: 'root',
})
export class TaskValidationService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);
  private identityTokenService = inject(IdentityTokenService);

  getLatest(): Observable<RawTaskValidation[]> {
    const slsApiUrl = this.config.slsApiUrl;
    if (!slsApiUrl) return of([]);

    return this.identityTokenService.identityToken$.pipe(
      take(1),
      switchMap(token => this.http.get<unknown>(`${slsApiUrl}/validations`, {
        headers: { authorization: `Bearer ${token}` },
      })),
      decodeSnakeCase(taskValidationsResponseSchema),
      map(resp => resp.validations),
    );
  }
}
