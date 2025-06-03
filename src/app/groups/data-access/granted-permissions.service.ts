import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { decodeSnakeCaseZod } from '../../utils/operators/decode';
import { APPCONFIG } from '../../app.config';
import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { itemCorePermSchema, itemEntryTimePermSchema, itemSessionPermSchema } from 'src/app/items/models/item-permissions';

const grantedPermissionsSchema = z.object({
  group: z.object({
    id: z.string(),
    name: z.string(),
  }),
  item: z.object({
    id: z.string(),
    languageTag: z.string(),
    requiresExplicitEntry: z.boolean(),
    title: z.string().nullable(),
  }),
  permissions: itemCorePermSchema.and(itemSessionPermSchema).and(itemEntryTimePermSchema),
  sourceGroup: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type GrantedPermissions = z.infer<typeof grantedPermissionsSchema>;

@Injectable({
  providedIn: 'root'
})
export class GrantedPermissionsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {
  }

  get(id: string, descendants = 0): Observable<GrantedPermissions[]> {
    const httpParams = new HttpParams().set('descendants', descendants);
    return this.http.get<unknown>(`${this.config.apiUrl}/groups/${ id }/granted_permissions`, {
      params: httpParams,
    }).pipe(
      decodeSnakeCaseZod(z.array(grantedPermissionsSchema)),
    );
  }
}
