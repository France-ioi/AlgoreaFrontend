import { Component, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { withManagementAdditions, ManagementAdditions } from '../../helpers/group-management';
import { map } from 'rxjs/operators';
import { OverlayPanel } from 'primeng/overlaypanel';
import { GroupData } from '../../services/group-datasource.service';
import { ReplaySubject, combineLatest } from 'rxjs';
import { GroupNavTreeService } from '../../../../core/services/navigation/group-nav-tree.service';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';

@Component({
  selector: 'alg-group-header',
  templateUrl: './group-header.component.html',
  styleUrls: [ './group-header.component.scss' ],
})
export class GroupHeaderComponent implements OnChanges, OnDestroy {
  @Input() groupData?: GroupData;

  @ViewChild('op') op?: OverlayPanel;

  private readonly group$ = new ReplaySubject<Group>(1);

  groupWithManagement?: Group & ManagementAdditions;
  isCurrentGroupWatched$ = combineLatest([ this.groupWatchingService.watchedGroup$, this.group$ ]).pipe(
    map(([ watchedGroup, group ]) => !!(watchedGroup && watchedGroup.route.id === group.id)),
  );

  navigationNeighbors$ = this.groupNavTreeService.navigationNeighbors$;

  constructor(
    private groupWatchingService: GroupWatchingService,
    private groupNavTreeService: GroupNavTreeService,
  ) {}

  ngOnChanges(): void {
    this.groupWithManagement = this.groupData?.group ? withManagementAdditions(this.groupData.group) : undefined;

    if (this.groupData) {
      this.group$.next(this.groupData.group);
    }
  }

  ngOnDestroy(): void {
    this.group$.complete();
  }

  onStartWatchButtonClicked(event: Event): void {
    if (!this.groupData?.group) throw new Error("unexpected group not set in 'onWatchButtonClicked'");
    this.groupWatchingService.startGroupWatching(this.groupData.route, this.groupData.group);
    this.openSuggestionOfActivitiesOverlayPanel(event);
  }

  onStopWatchButtonClicked(): void {
    this.op?.hide();
    this.groupWatchingService.stopWatching();
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
