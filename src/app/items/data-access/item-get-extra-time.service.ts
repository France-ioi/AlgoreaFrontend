import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/app.config';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';

const itemAdditionalTimeSchema = z.object({
  additionalTime: z.number(),
  totalAdditionalTime: z.number(),
});

type ItemAdditionalTimeSchema = z.infer<typeof itemAdditionalTimeSchema>;

@Injectable({
  providedIn: 'root'
})
export class ItemGetExtraTimeService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  getForGroup(itemId: string, groupId: string): Observable<ItemAdditionalTimeSchema> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${itemId}/groups/${groupId}/additional-times`)
      .pipe(
        decodeSnakeCase(itemAdditionalTimeSchema),
      );
  }

}
