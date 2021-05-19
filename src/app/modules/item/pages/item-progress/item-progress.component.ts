import { Component, Input } from '@angular/core';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemData } from '../../services/item-datasource.service';

@Component({
  selector: 'alg-item-progress',
  templateUrl: './item-progress.component.html',
  styleUrls: [ './item-progress.component.scss' ]
})
export class ItemProgressComponent {

  @Input() itemData?: ItemData;

  watchedGroup$ = this.sessionService.watchedGroup$;

  constructor(private sessionService: UserSessionService) {}
}
