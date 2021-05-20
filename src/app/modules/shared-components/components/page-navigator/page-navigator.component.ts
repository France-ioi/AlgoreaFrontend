import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { isNotNullOrUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Observable } from 'rxjs';
import { appConfig } from '../../../../shared/helpers/config';
import { HttpClient } from '@angular/common/http';
import { mapToFetchState } from '../../../../shared/operators/state';

@Component({
  selector: 'alg-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: [ './page-navigator.component.scss' ],
})
export class PageNavigatorComponent {
  @Input() allowWatching = false;
  @Input() allowEditing = false;
  @Input() allowFullScreen = false;
  @Input() navigationMode = 'nextAndPrev';
  @Input() groupId?: string;

  @Output() edit = new EventEmitter<void>();
  @Output() watch = new EventEmitter<void>();
  @Output() stopWatch = new EventEmitter<void>();

  @ViewChild('op') private op?: OverlayPanel;
  @ViewChild('startWatch') private startWatchRef?: ElementRef;

  isCurrentGroupWatched$ = this.userSessionService.session$.pipe(
    filter(isNotNullOrUndefined),
    map(data => this.groupId !== undefined && data.watchedGroup?.id === this.groupId)
  );

  state$ = this.userSessionService.session$.pipe(
    filter(isNotNullOrUndefined),
    map(data => data.watchedGroup),
    filter(isNotNullOrUndefined),
    switchMap(watchedGroup => this.getList$(watchedGroup.id)),
    mapToFetchState()
  );

  constructor(private userSessionService: UserSessionService, private http: HttpClient) {
  }

  onStartWatchClick(e: Event): void {
    this.op?.show(e);

    setTimeout(() => {
      this.watch.emit();
    }, 250);
  }

  getList$(watchedGroupId: string): Observable<any> {
    return this.http.get(`${appConfig.apiUrl}/current-user/group-memberships/activities`, {
      params: { watched_group_id: watchedGroupId }
    });
  }
}
