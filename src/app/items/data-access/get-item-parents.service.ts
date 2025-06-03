import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { itemCorePermSchema } from 'src/app/items/models/item-permissions';
import { itemStringSchema } from 'src/app/items/models/item-string';
import { itemChildCategorySchema } from 'src/app/items/models/item-properties';
import { itemTypeSchema } from 'src/app/items/models/item-type';

const itemParentsSchema = z.array(
  z.object({
    id: z.string(),
    bestScore: z.number(),
    string: itemStringSchema,
    category: itemChildCategorySchema,
    type: itemTypeSchema,
    permissions: itemCorePermSchema,
    result: z.object({
      attemptId: z.string(),
      latestActivityAt: z.coerce.date(),
      startedAt: z.coerce.date().nullable(),
      scoreComputed: z.number(),
      validated: z.boolean()
    }).nullable()
  })
);

type ItemParents = z.infer<typeof itemParentsSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetItemParentsService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  get(id: string, attemptId: string): Observable<ItemParents> {
    let params = new HttpParams();
    params = params.set('attempt_id', attemptId);
    return this.http
      .get<unknown[]>(`${this.config.apiUrl}/items/${id}/parents`, { params: params })
      .pipe(
        decodeSnakeCase(itemParentsSchema)
      );
  }
}
