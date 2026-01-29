import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APPCONFIG } from 'src/app/config';
import { z } from 'zod';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';

const groupAdditionalTimesSchema = z.array(
  z.object({
    groupId: z.string(),
    name: z.string(),
    type: z.string(),
    additionalTime: z.number(),
    totalAdditionalTime: z.number(),
  })
);

type GroupAdditionalTimes = z.infer<typeof groupAdditionalTimesSchema>;

@Injectable({
  providedIn: 'root'
})
export class ExtraTimeService {
  private http = inject(HttpClient);
  private config = inject(APPCONFIG);

  getForGroupDescendant(itemId: string, groupId: string): Observable<GroupAdditionalTimes> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${itemId}/groups/${groupId}/members/additional-times`)
      .pipe(
        decodeSnakeCase(groupAdditionalTimesSchema),
      );
  }

}
