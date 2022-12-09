import { Component, Input, OnChanges } from '@angular/core';
import { IncomingThreadEvent } from '../../services/threads-inbound-events';
import { UserInfo } from './thread-user-info';

@Component({
  selector: 'alg-thread-message[event]',
  templateUrl: './thread-message.component.html',
  styleUrls: [ './thread-message.component.scss' ],
})
export class ThreadMessageComponent implements OnChanges {
  @Input() event!: IncomingThreadEvent;
  @Input() userCache: UserInfo[] = [];
  userInfo?: UserInfo & { name: string };

  ngOnChanges(): void {
    const userInfo = this.userCache.find(user => user.id === this.event.createdBy);
    this.userInfo = userInfo ? { ...userInfo, name: userInfo.name ?? $localize`An unknown user` } : undefined;
  }

}
