import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';

const itemAdditionalTimeSchema = z.object({
  additionalTime: z.number(),
  totalAdditionalTime: z.number(),
});

type ItemAdditionalTimeSchema = z.infer<typeof itemAdditionalTimeSchema>;

@Injectable({
  providedIn: 'root'
})
export class ItemGetExtraTimeService {
  constructor(private http: HttpClient) {}

  getForGroup(itemId: string, groupId: string): Observable<ItemAdditionalTimeSchema> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/items/${itemId}/groups/${groupId}/additional-times`)
      .pipe(
        decodeSnakeCaseZod(itemAdditionalTimeSchema),
      );
  }

}
