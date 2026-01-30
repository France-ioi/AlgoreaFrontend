import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Store } from '@ngrx/store';
import { fromNotification } from '../../store/notification';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimePipe } from 'src/app/pipes/relativeTime';
import { ToDatePipe } from 'src/app/pipes/toDate';
import { isForumNewMessageNotification } from 'src/app/data-access/notification.service';
import { mapStateData } from 'src/app/utils/state';

@Component({
  selector: 'alg-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  imports: [ CdkMenuTrigger, CdkMenu, CdkMenuItem, LoadingComponent, ErrorComponent, RelativeTimePipe, ToDatePipe ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private store = inject(Store);
  private rawState = this.store.selectSignal(fromNotification.selectNotificationsState);

  notificationsState = computed(() =>
    mapStateData(this.rawState(), data => data.filter(isForumNewMessageNotification))
  );

  badgeText = computed(() => {
    const s = this.notificationsState();
    switch (s.tag) {
      case 'fetching': return '?';
      case 'error': return '!';
      case 'ready': return String(s.data.filter(n => n.readTime === undefined).length);
    }
  });
}
