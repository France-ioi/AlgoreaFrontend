import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UserSessionService } from '../../../../shared/services/user-session.service';
import { filter, map } from 'rxjs/operators';
import { isNotNullOrUndefined } from '../../../../shared/helpers/is-not-null-or-undefined';

@Component({
  selector: 'alg-page-navigator',
  templateUrl: './page-navigator.component.html',
  styleUrls: [ './page-navigator.component.scss' ],
})
export class PageNavigatorComponent {
  @Input() allowWatching = false;
  @Input() allowEditing = false;
  @Input() allowFullScreen = false;
  @Input() navigationMode = 'nextAndPrev';
  @Input() groupId?: string;

  @Output() edit = new EventEmitter<void>();
  @Output() watch = new EventEmitter<void>();
  @Output() stopWatch = new EventEmitter<void>();

  isCurrentGroupWatched$ = this.userSessionService.session$.pipe(
    filter(isNotNullOrUndefined),
    map(data => data?.watchedGroup?.id === this.groupId)
  );

  constructor(private userSessionService: UserSessionService) {
  }
}
