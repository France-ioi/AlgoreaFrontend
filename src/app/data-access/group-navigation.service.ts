import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APPCONFIG } from '../app.config';
import { inject } from '@angular/core';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { Cacheable } from 'ts-cacheable';
import { z } from 'zod';
import { SECONDS } from '../utils/duration';

const cacheConfig = { maxAge: 10*SECONDS, maxCacheCount: 5 };

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
  private config = inject(APPCONFIG);

  constructor(private http: HttpClient) {}

  @Cacheable(cacheConfig)
  getGroupNavigation(groupId: string): Observable<GroupNavigationData> {
    return this.http.get<unknown>(`${this.config.apiUrl}/groups/${groupId}/navigation`).pipe(
      decodeSnakeCase(groupNavigationSchema),
    );
  }

  @Cacheable(cacheConfig)
  getRoot(): Observable<GroupNavigationChild[]> {
    return this.http.get<unknown>(`${this.config.apiUrl}/groups/roots`).pipe(
      decodeSnakeCase(z.array(groupNavigationChildSchema)),
    );
  }
}
