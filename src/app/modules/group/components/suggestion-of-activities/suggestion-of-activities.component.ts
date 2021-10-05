import { Component } from '@angular/core';
import { ItemNavigationService } from '../../../../core/http-services/item-navigation.service';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { switchMap, filter, map } from 'rxjs/operators';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { mapToFetchState } from '../../../../shared/operators/state';

@Component({
  selector: 'alg-suggestion-of-activities',
  templateUrl: './suggestion-of-activities.component.html',
  styleUrls: [ './suggestion-of-activities.component.scss' ],
})
export class SuggestionOfActivitiesComponent {
  readonly state$ = this.sessionService.watchedGroup$.pipe(
    filter(isNotUndefined),
    switchMap(watchedGroup =>
      this.itemNavigationService.getRootActivities(watchedGroup.route.id).pipe(
        map(rootActivity =>
          rootActivity.sort(item => (item.groupId === watchedGroup.route.id ? -1 : 1)).slice(0, 4)
        ),
      )
    ),
    mapToFetchState(),
  );

  constructor(
    private sessionService: UserSessionService,
    private itemNavigationService: ItemNavigationService) {
  }

}
