import { Component, OnDestroy } from '@angular/core';
import { ItemNavigationService } from 'src/app/core/http-services/item-navigation.service';
import { switchMap, filter, map } from 'rxjs/operators';
import { isNotNull } from 'src/app/shared/helpers/null-undefined-predicates';
import { mapToFetchState } from 'src/app/shared/operators/state';
import { Subject } from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';

@Component({
  selector: 'alg-suggestion-of-activities',
  templateUrl: './suggestion-of-activities.component.html',
  styleUrls: [ './suggestion-of-activities.component.scss' ],
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
