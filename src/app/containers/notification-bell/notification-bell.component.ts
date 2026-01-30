import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Store } from '@ngrx/store';
import { fromNotification } from '../../store/notification';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimePipe } from 'src/app/pipes/relativeTime';

@Component({
  selector: 'alg-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  imports: [ CdkMenuTrigger, CdkMenu, CdkMenuItem, LoadingComponent, ErrorComponent, RelativeTimePipe ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private store = inject(Store);
  private notificationsState = this.store.selectSignal(fromNotification.selectNotificationsState);

  isFetching = computed(() => this.notificationsState()?.isFetching ?? true);
  isError = computed(() => this.notificationsState()?.isError ?? false);

  notifications = computed(() => {
    const state = this.notificationsState();
    if (!state?.isReady) return [];
    return state.data.map(n => ({
      ...n,
      date: new Date(n.sk),
    }));
  });

  badgeText = computed(() => {
    const state = this.notificationsState();
    if (state.isFetching) return '?';
    if (state.isError) return '!';
    if (state.isReady) {
      const unreadCount = state.data.filter(n => n.readTime === undefined).length;
      return String(unreadCount);
    }
    return '?'; // Fallback
  });
}
