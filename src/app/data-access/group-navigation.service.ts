import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { APPCONFIG } from '../config';
import { decodeSnakeCase } from 'src/app/utils/operators/decode';
import { Cacheable } from 'ts-cacheable';
import { z } from 'zod';
import { MINUTES } from '../utils/duration';
import { CurrentContentService } from '../services/current-content.service';
import { IObservableCacheConfig } from 'ts-cacheable/dist/cjs/common/IObservableCacheConfig';

const cacheBuster$ = new Subject<void>();
const cacheConfig: IObservableCacheConfig = { maxAge: 2*MINUTES, maxCacheCount: 5, cacheBusterObserver: cacheBuster$ };

const groupNavigationChildSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([ 'Class', 'Team', 'Club', 'Friends', 'Other', 'User', 'Session', 'Base' ]),
  currentUserManagership: z.enum([ 'none', 'direct', 'ancestor', 'descendant' ]),
  currentUserMembership: z.enum([ 'none', 'direct', 'descendant' ]),
  hasVisibleChildren: z.boolean(),
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
  private http = inject(HttpClient);
  private currentContent = inject(CurrentContentService);
  private config = inject(APPCONFIG);

  constructor() {
    this.currentContent.navMenuReload$.pipe(
      takeUntilDestroyed(),
    ).subscribe(() => cacheBuster$.next());
  }

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
