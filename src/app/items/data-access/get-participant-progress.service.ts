import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { APPCONFIG } from 'src/app/app.config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { z } from 'zod';
import { itemCorePermSchema } from 'src/app/items/models/item-permissions';

const participantProgressSchema = z.object({
  item: z.object({
    hintsRequested: z.number(),
    itemId: z.string(),
    latestActivityAt: z.coerce.date().nullable(),
    score: z.number(),
    submissions: z.number(),
    timeSpent: z.number(),
    validated: z.boolean(),
  }),
  children: z.array(
    z.object({
      currentUserPermissions: itemCorePermSchema,
      hintsRequested: z.number(),
      itemId: z.string(),
      latestActivityAt: z.coerce.date().nullable(),
      noScore: z.boolean(),
      score: z.number(),
      string: z.object({
        languageTag: z.string(),
        title: z.string().nullable(),
      }),
      submissions: z.number(),
      timeSpent: z.number(),
      type: z.enum([ 'Chapter', 'Task', 'Skill' ]),
      validated: z.boolean(),
    })
  ).optional(),
});

export type ParticipantProgress = z.infer<typeof participantProgressSchema>;

@Injectable({
  providedIn: 'root'
})
export class GetParticipantProgressService {
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) { }

  get(id: string): Observable<ParticipantProgress> {
    return this.http
      .get<unknown>(`${this.config.apiUrl}/items/${id}/participant-progress`)
      .pipe(
        decodeSnakeCase(participantProgressSchema)
      );
  }
}
