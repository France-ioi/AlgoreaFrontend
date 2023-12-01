import { Component, OnDestroy } from '@angular/core';
import { ItemNavigationService } from '../../data-access/item-navigation.service';
import { switchMap, filter, map } from 'rxjs/operators';
import { isNotNull } from '../../utils/null-undefined-predicates';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { Subject } from 'rxjs';
import { GroupWatchingService } from '../../services/group-watching.service';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { ErrorComponent } from '../../ui-components/error/error.component';
import { LoadingComponent } from '../../ui-components/loading/loading.component';
import { NgIf, AsyncPipe, NgFor } from '@angular/common';

@Component({
  selector: 'alg-suggestion-of-activities',
  templateUrl: './suggestion-of-activities.component.html',
  styleUrls: [ './suggestion-of-activities.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    SharedModule,
    RouterLink,
    AsyncPipe,
    RawItemRoutePipe,
    RouteUrlPipe,
    NgFor,
  ],
})
export class SuggestionOfActivitiesComponent implements OnDestroy {
  private refresh$ = new Subject<void>();
  readonly state$ = this.groupWatchingService.watchedGroup$.pipe(
    filter(isNotNull),
    switchMap(watchedGroup =>
      this.itemNavigationService.getRootActivities(watchedGroup.route.id).pipe(
        map(rootActivities => [
          ...rootActivities.filter(act => act.groupId === watchedGroup.route.id),
          ...rootActivities.filter(act => act.groupId !== watchedGroup.route.id),
        ].slice(0, 4))
      )
    ),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private groupWatchingService: GroupWatchingService,
    private itemNavigationService: ItemNavigationService) {
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  refresh(event: MouseEvent): void {
    event.stopPropagation();
    this.refresh$.next();
  }

}
