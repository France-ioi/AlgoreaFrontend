import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { catchError, debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { isNotNullOrUndefined, isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { OverlayPanel } from 'primeng/overlaypanel';
import { concat, Observable, of } from 'rxjs';
import { ItemNavigationService, RootActivity } from '../../../../core/http-services/item-navigation.service';
import { errorState, fetchingState, readyState } from '../../../../shared/helpers/state';

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

  overlayPanelMarginTop = true;

  isCurrentGroupWatched$ = this.userSessionService.session$.pipe(
    filter(isNotNullOrUndefined),
    map(data => this.groupId !== undefined && data.watchedGroup?.id === this.groupId)
  );

  state$ = this.userSessionService.watchedGroup$.pipe(
    debounceTime(0),
    filter(isNotUndefined),
    switchMap(watchedGroup =>
      concat(
        of(fetchingState()),
        this.getList$(watchedGroup.id).pipe(
          map(readyState),
          catchError(e => of(errorState(e))),
        )
      )
    ),
  );

  constructor(private userSessionService: UserSessionService,
              private itemNavigationService: ItemNavigationService) {
  }

  onStartWatchClick(e: Event): void {
    this.op?.show(e);

    this.overlayPanelMarginTop = !document.querySelector('alg-observation-bar');

    setTimeout(() => {
      this.watch.emit();
    });
  }

  getList$(watchedGroupId: string): Observable<RootActivity[]> {
    return this.itemNavigationService.getRootActivities(watchedGroupId).pipe(
      map((rootActivity: RootActivity[]) =>
        rootActivity.sort(item => (item.group_id === item.group_id ? -1 : 1)).slice(0, 5)
      )
    );
  }
}
