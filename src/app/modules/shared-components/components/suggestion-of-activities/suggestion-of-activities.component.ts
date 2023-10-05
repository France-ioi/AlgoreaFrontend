import { Component, OnDestroy } from '@angular/core';
import { ItemNavigationService } from 'src/app/core/http-services/item-navigation.service';
import { switchMap, filter, map } from 'rxjs/operators';
import { isNotNull } from 'src/app/shared/helpers/null-undefined-predicates';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { Subject } from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/shared/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ErrorComponent } from '../error/error.component';
import { LoadingComponent } from '../loading/loading.component';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-suggestion-of-activities',
  templateUrl: './suggestion-of-activities.component.html',
  styleUrls: [ './suggestion-of-activities.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ErrorComponent,
    TableModule,
    SharedModule,
    RouterLink,
    AsyncPipe,
    RawItemRoutePipe,
    RouteUrlPipe,
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

  refresh(): void {
    this.refresh$.next();
  }

}
