import { Component, Input } from '@angular/core';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GetGroupByIdService } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-chapter-view',
  templateUrl: './item-chapter-view.component.html',
  styleUrls: [ './item-chapter-view.component.scss' ]
})
export class ItemChapterViewComponent {

  @Input() itemData?: ItemData;

  session$ = this.sessionService.session$.pipe(switchMap(session => {
    if (!session) return of(undefined);
    if (!session.watchedGroup) return of({ user: session.user, group: undefined });
    return this.getGroupByIdService.get(session.watchedGroup?.id).pipe(map(group => ({
      user: session.user,
      group: group,
    })));
  }));

  constructor(
    private sessionService: UserSessionService,
    private getGroupByIdService: GetGroupByIdService,
  ) {}
}
