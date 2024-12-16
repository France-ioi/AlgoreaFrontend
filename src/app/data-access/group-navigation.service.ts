import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from 'src/app/utils/config';
import { decodeSnakeCaseZod } from 'src/app/utils/operators/decode';
import { z } from 'zod';

const groupNavigationChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base' ]),
  currentUserManagership: z.enum([ 'none', 'direct', 'ancestor', 'descendant' ]),
  currentUserMembership: z.enum([ 'none', 'direct', 'descendant' ]),
});

export type GroupNavigationChild = z.infer<typeof groupNavigationChildSchema>;

const groupNavigationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'Session', 'Base' ]),
  children: z.array(groupNavigationChildSchema),
});

export type GroupNavigationData = z.infer<typeof groupNavigationSchema>;

@Injectable({
  providedIn: 'root'
})
export class GroupNavigationService {

  constructor(private http: HttpClient) {}

  getGroupNavigation(groupId: string): Observable<GroupNavigationData> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/${groupId}/navigation`).pipe(
      decodeSnakeCaseZod(groupNavigationSchema),
    );
  }

  getRoot(): Observable<GroupNavigationChild[]> {
    return this.http.get<unknown>(`${appConfig.apiUrl}/groups/roots`).pipe(
      decodeSnakeCaseZod(z.array(groupNavigationChildSchema)),
    );
  }

}
