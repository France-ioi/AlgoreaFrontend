import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { entryStateValueSchema } from '../models/item-entry';
import { ItemRoute } from 'src/app/models/routing/item-route';
import { SimpleActionResponse, successData } from 'src/app/data-access/action-response';
import { durationSchema } from 'src/app/utils/decoders';

const entryStateSchema = z.object({
  currentUserCanEnter: z.boolean(),
  state: entryStateValueSchema,
});

type EntryState = z.infer<typeof entryStateSchema>;

const enterResponseDataSchema = z.object({
  duration: durationSchema.nullable(),
  enteredAt: z.coerce.date(),
});

type EnterResponseData = z.infer<typeof enterResponseDataSchema>;

@Injectable({
  providedIn: 'root'
})
export class ItemEntryService {

  constructor(private http: HttpClient) {}

  getEntryState(itemId: string): Observable<EntryState> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/items/${itemId}/entry-state`)
      .pipe(
        decodeSnakeCaseZod(entryStateSchema),
      );
  }

  enter(route: ItemRoute): Observable<EnterResponseData> {
    const parentAttemptId = route.parentAttemptId;
    if (!parentAttemptId) throw new Error('enter service expect the parent attempt id to be set');
    const params = new HttpParams({ fromObject: { parent_attempt_id: parentAttemptId } });
    return this.http
      .post<SimpleActionResponse>(`${appConfig.apiUrl}/items/${route.path.join('/')}/${route.id}/enter`, null, { params }).pipe(
        map(successData),
        decodeSnakeCaseZod(enterResponseDataSchema),
      );
  }

}
