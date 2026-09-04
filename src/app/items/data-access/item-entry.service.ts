import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { entryStateValueSchema } from '../models/item-entry';
import { ItemRoute } from 'src/app/models/routing/item-route';
import { ActionResponse, successData } from 'src/app/data-access/action-response';
import { durationSchema } from 'src/app/utils/decoders';

const entryStateSchema = z.object({
  currentUserCanEnter: z.boolean(),
  state: entryStateValueSchema,
});

type EntryState = z.infer<typeof entryStateSchema>;

const enterResponseDataSchema = z.object({
  attemptId: z.string(),
  duration: durationSchema.nullable(),
  enteredAt: z.coerce.date(),
});

type EnterResponseData = z.infer<typeof enterResponseDataSchema>;

@Injectable({
  providedIn: 'root'
})
export class ItemEntryService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getEntryState(itemId: string): Observable<EntryState> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${itemId}/entry-state`)
      .pipe(
        decodeSnakeCase(entryStateSchema),
      );
  }

  enter(route: ItemRoute & Required<Pick<ItemRoute, 'parentAttemptId'>>): Observable<EnterResponseData> {
    const params = new HttpParams({ fromObject: { parent_attempt_id: route.parentAttemptId } });
    const path = route.path.length > 0 ? route.path.join('/') + '/' + route.id : route.id;
    return this.http
      .post<ActionResponse<unknown>>(`${this.config.apiUrl}/items/${path}/enter`, null, { params }).pipe(
        map(successData),
        decodeSnakeCase(enterResponseDataSchema),
      );
  }

}
