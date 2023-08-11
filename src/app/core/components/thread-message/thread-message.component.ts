import { Component, Input, OnChanges } from '@angular/core';
import { RawItemRoute } from 'src/app/shared/routing/item-route';
import { IncomingThreadEvent } from '../../../modules/item/services/threads-inbound-events';
import { UserInfo } from './thread-user-info';

@Component({
  selector: 'alg-thread-message[event]',
  templateUrl: './thread-message.component.html',
  styleUrls: [ './thread-message.component.scss' ],
})
export class ThreadMessageComponent implements OnChanges {
  @Input() event!: IncomingThreadEvent;
  @Input() userCache: UserInfo[] = [];
  @Input() canCurrentUserLoadAnswers = false;
  @Input() itemRoute?: RawItemRoute;
  userInfo?: UserInfo & { name: string };

  ngOnChanges(): void {
    const userInfo = this.userCache.find(user => user.id === this.event.createdBy);
    this.userInfo = userInfo ? { ...userInfo, name: userInfo.name ?? $localize`An unknown user` } : undefined;
  }

}
