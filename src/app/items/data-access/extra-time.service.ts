import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { z } from 'zod';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';

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

  constructor(private http: HttpClient) {}

  getForGroupDescendant(itemId: string, groupId: string): Observable<GroupAdditionalTimes> {
    return this.http
      .get<unknown>(`${appConfig.apiUrl}/items/${itemId}/groups/${groupId}/members/additional-times`)
      .pipe(
        decodeSnakeCaseZod(groupAdditionalTimesSchema),
      );
  }

}
