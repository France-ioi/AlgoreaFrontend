import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { filter, map, switchMap } from 'rxjs/operators';
import { isNotNullOrUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Observable } from 'rxjs';
import { mapToFetchState } from '../../../../shared/operators/state';
import {
  ItemNavigationService,
  NavMenuItem,
  NavMenuRootItem
} from '../../../../core/http-services/item-navigation.service';

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

  state$ = this.userSessionService.session$.pipe(
    filter(isNotNullOrUndefined),
    map(data => data.watchedGroup),
    filter(isNotNullOrUndefined),
    switchMap(watchedGroup => this.getList$(watchedGroup.id)),
    mapToFetchState()
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

  getList$(watchedGroupId: string): Observable<NavMenuItem[]> {
    return this.itemNavigationService.getRootActivities(watchedGroupId).pipe(
      map((navMenuRootItem: NavMenuRootItem) => navMenuRootItem.items)
    );
  }
}
