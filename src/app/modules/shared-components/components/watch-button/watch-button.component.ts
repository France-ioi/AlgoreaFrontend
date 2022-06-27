import { Component, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';
import { GroupWatchingService, StartWatchGroupInfo } from '../../../../core/services/group-watching.service';
import { combineLatest, map, ReplaySubject } from 'rxjs';
import { GroupRoute } from '../../../../shared/routing/group-route';

@Component({
  selector: 'alg-watch-button',
  templateUrl: './watch-button.component.html',
  styleUrls: [ './watch-button.component.scss' ],
})
export class WatchButtonComponent implements OnChanges, OnDestroy {
  @ViewChild('op') op?: OverlayPanel;

  @Input() route?: GroupRoute;
  @Input() startWatchGroupInfo?: StartWatchGroupInfo;

  startWatchGroupInfo$ = new ReplaySubject<StartWatchGroupInfo>(1);
  isCurrentGroupWatched$ = combineLatest([
    this.groupWatchingService.watchedGroup$,
    this.startWatchGroupInfo$,
  ]).pipe(
    map(([ watchedGroup, startWatchGroupInfo ]) => !!(watchedGroup && watchedGroup.route.id === startWatchGroupInfo.id)),
  );

  constructor(private groupWatchingService: GroupWatchingService) {
  }

  ngOnChanges(): void {
    if (this.startWatchGroupInfo) {
      this.startWatchGroupInfo$.next(this.startWatchGroupInfo);
    }
  }

  ngOnDestroy(): void {
    this.startWatchGroupInfo$.complete();
  }

  toggleWatchingMode(event: Event, isWatching: boolean): void {
    if (!this.startWatchGroupInfo) throw new Error("unexpected group not set in 'onWatchButtonClicked'");
    if (!this.route) throw new Error("unexpected route not set in 'onWatchButtonClicked'");

    if (isWatching) {
      this.op?.hide();
      this.groupWatchingService.stopWatching();
      return;
    }

    this.groupWatchingService.startGroupWatching(this.route, {
      id: this.startWatchGroupInfo.id,
      name: this.startWatchGroupInfo.name,
      currentUserCanGrantGroupAccess: this.startWatchGroupInfo.currentUserCanGrantGroupAccess,
    });
    this.openSuggestionOfActivitiesOverlayPanel(event);
  }

  openSuggestionOfActivitiesOverlayPanel(event: Event): void {
    this.op?.show(event);

    // Align method needs to be called because top banner of observing group
    // changes position of the page and as result we have a bug with wrong tooltip positioning.
    // Async function/wrapper setTimeout - guarantees to call align method after position of page changed
    setTimeout(() => {
      this.op?.align();
    });
  }
}
