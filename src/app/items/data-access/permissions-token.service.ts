import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { z } from 'zod';
import { APPCONFIG } from 'src/app/config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { ActionResponse, successData } from 'src/app/data-access/action-response';

const permissionsTokenDataSchema = z.object({
  permissionsToken: z.string(),
});

export type PermissionsToken = z.infer<typeof permissionsTokenDataSchema>['permissionsToken'];

@Injectable({
  providedIn: 'root',
})
export class PermissionsTokenService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  generate(itemId: string): Observable<PermissionsToken> {
    return this.http.post<ActionResponse<unknown>>(
      `${this.config.apiUrl}/items/${itemId}/permissions-token`,
      undefined,
    ).pipe(
      map(successData),
      decodeSnakeCase(permissionsTokenDataSchema),
      map(data => data.permissionsToken),
    );
  }
}
