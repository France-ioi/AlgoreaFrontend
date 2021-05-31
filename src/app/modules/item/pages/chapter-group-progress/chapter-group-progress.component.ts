import { Component, Input } from '@angular/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GetGroupByIdService } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-chapter-group-progress',
  templateUrl: './chapter-group-progress.component.html',
  styleUrls: [ './chapter-group-progress.component.scss' ]
})
export class ChapterGroupProgressComponent {

  @Input() itemData?: ItemData;

  group$ = this.sessionService.watchedGroup$.pipe(
    switchMap(watchedGroup => {
      if (!watchedGroup) return of(undefined);
      return this.getGroupByIdService.get(watchedGroup.id);
    })
  );

  constructor(
    private sessionService: UserSessionService,
    private getGroupByIdService: GetGroupByIdService,
  ) {}
}
