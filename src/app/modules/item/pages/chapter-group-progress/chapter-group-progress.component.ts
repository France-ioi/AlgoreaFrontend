import { Component, Input } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { GetGroupByIdService } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemData } from '../../services/item-datasource.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { Subject } from 'rxjs';

@Component({
  selector: 'alg-chapter-group-progress',
  templateUrl: './chapter-group-progress.component.html',
  styleUrls: [ './chapter-group-progress.component.scss' ]
})
export class ChapterGroupProgressComponent {

  @Input() itemData?: ItemData;

  private refresh$ = new Subject<void>();
  state$ = this.sessionService.watchedGroup$.pipe(
    filter(isNotUndefined),
    switchMap(watchedGroup => this.getGroupByIdService.get(watchedGroup.route.id)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private sessionService: UserSessionService,
    private getGroupByIdService: GetGroupByIdService,
  ) {}

  refresh(): void {
    this.refresh$.next();
  }
}
