import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, defer, fromEvent, interval, merge, of, share, timer } from 'rxjs';
import { catchError, exhaustMap, filter, map, retry, take } from 'rxjs/operators';
import { readAppVersionFromDocument, readAppVersionFromHtml } from 'src/app/utils/app-version';
import { MINUTES, SECONDS } from 'src/app/utils/duration';

// How long the tab must have been inactive (hidden, asleep, or frozen) before we compare versions.
// Short enough that multi-hour stale sessions are caught; long enough that brief tab switches do not nag.
const INACTIVITY_THRESHOLD_MS = 20 * MINUTES;
// Fallback when no wake event or user input fires after sleep; far below the threshold so normal
// timer jitter cannot look like a 20 min freeze. (Visible-tab timers are not ~1 min throttled.)
const HEARTBEAT_INTERVAL_MS = 30 * SECONDS;
// After sleep, Wi-Fi often reconnects a few seconds later — one delayed retry for status-0 only.
const OFFLINE_RETRY_DELAY_MS = 2 * SECONDS;
const USER_INPUT_EVENT_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

type InactivitySource = 'visibility' | 'wake';

@Injectable({
  providedIn: 'root',
})
export class AppVersionCheckService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);

  // Seed when the tab opens already hidden (e.g. middle-click) so the first reveal can still check.
  private hiddenAt: number | null = this.document.visibilityState === 'hidden' ? Date.now() : null;
  private lastAliveAt = Date.now();

  /**
   * Emits once when the tab returns after ≥ 20 minutes of inactivity (long hide, or JS freeze /
   * system sleep while still visible) and the deployed HTML meta app-version differs from the
   * running document's. Wake is the earliest of: first pointerdown/keydown on this document past
   * the gap (not inside task/description iframes), visibility reveal, resume/focus/pageshow, or a
   * ~30s heartbeat. Network/parse/missing-version failures are silent (no emit); offline (status 0)
   * gets one delayed retry before giving up.
   */
  readonly newVersionAvailable$: Observable<void> = defer(() => {
    this.lastAliveAt = Date.now();
    return merge(
      fromEvent(this.document, 'visibilitychange').pipe(map((): InactivitySource => 'visibility')),
      fromEvent(this.document, 'resume').pipe(map((): InactivitySource => 'wake')),
      this.document.defaultView
        ? merge(
          fromEvent(this.document.defaultView, 'focus').pipe(map((): InactivitySource => 'wake')),
          fromEvent(this.document.defaultView, 'pageshow').pipe(map((): InactivitySource => 'wake')),
        )
        : EMPTY,
      // Hot path: skip with no state write when the alive gap is still below the threshold.
      merge(
        fromEvent(this.document, 'pointerdown', USER_INPUT_EVENT_OPTIONS),
        fromEvent(this.document, 'keydown', USER_INPUT_EVENT_OPTIONS),
      ).pipe(
        filter(() => Date.now() - this.lastAliveAt >= INACTIVITY_THRESHOLD_MS),
        map((): InactivitySource => 'wake'),
      ),
      interval(HEARTBEAT_INTERVAL_MS).pipe(map((): InactivitySource => 'wake')),
    ).pipe(
      filter(source => this.isLongInactivity(source)),
      // Dedupes wake storms (e.g. resume + focus same tick) while a fetch is in flight.
      exhaustMap(() => this.fetchDeployedVersion()),
      filter((deployed): deployed is string => deployed !== null),
      filter(deployed => {
        const running = readAppVersionFromDocument(this.document);
        return running !== null && deployed !== running;
      }),
      map(() => undefined),
      take(1),
    );
  }).pipe(
    share({ resetOnRefCountZero: false, resetOnComplete: false }),
  );

  private isLongInactivity(source: InactivitySource): boolean {
    // Wall clock: performance.now() may pause during system sleep on some platforms.
    const now = Date.now();
    const aliveGap = now - this.lastAliveAt;
    let wasInactive = false;

    if (source === 'visibility') {
      if (this.document.visibilityState === 'hidden') {
        // Queued hidden/visible after thaw: backdate so a post-wake hiddenAt does not wipe the sleep gap.
        this.hiddenAt = aliveGap >= INACTIVITY_THRESHOLD_MS ? this.lastAliveAt : now;
      } else {
        const hiddenGap = this.hiddenAt !== null ? now - this.hiddenAt : 0;
        wasInactive = hiddenGap >= INACTIVITY_THRESHOLD_MS || aliveGap >= INACTIVITY_THRESHOLD_MS;
      }
    } else if (this.document.visibilityState === 'visible') {
      wasInactive = aliveGap >= INACTIVITY_THRESHOLD_MS;
    }

    if (this.document.visibilityState === 'visible') {
      this.hiddenAt = null;
    }
    this.lastAliveAt = now;
    return wasInactive;
  }

  private fetchDeployedVersion(): Observable<string | null> {
    // baseURI is this locale's shell (/en/, /fr/, …), not the root redirect stub — that is the HTML
    // that carries the stamped app-version meta for the running build.
    const url = new URL(this.document.baseURI);
    url.searchParams.set('_', String(Date.now()));
    return this.http.get(url.toString(), {
      responseType: 'text',
      headers: new HttpHeaders().set('Cache-Control', 'no-cache'),
    }).pipe(
      map(html => readAppVersionFromHtml(html)),
      retry({
        count: 1,
        delay: (error: unknown) => {
          if (!(error instanceof HttpErrorResponse) || error.status !== 0) throw error;
          return timer(OFFLINE_RETRY_DELAY_MS);
        },
      }),
      catchError(() => of(null)),
    );
  }
}
