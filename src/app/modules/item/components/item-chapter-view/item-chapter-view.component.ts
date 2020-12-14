import { Component, Input } from '@angular/core';
import { delay } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-chapter-view',
  templateUrl: './item-chapter-view.component.html',
  styleUrls: [ './item-chapter-view.component.scss' ]
})
export class ItemChapterViewComponent {

  @Input() itemData?: ItemData;

  session$ = this.sessionService.session$.pipe(delay(0));

  constructor(private sessionService: UserSessionService) {}
}
