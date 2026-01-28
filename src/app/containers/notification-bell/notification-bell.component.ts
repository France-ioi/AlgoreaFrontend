import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromNotification } from '../../store/notification';

@Component({
  selector: 'alg-notification-bell',
  template: `
    <div class="bell-container">
      <i class="ph-bold ph-bell"></i>
      <span class="badge" [class.error]="isError()">{{ badgeText() }}</span>
    </div>
  `,
  styles: [ `
    .bell-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      cursor: default;
    }

    .ph-bell {
      font-size: 1.25rem;
      color: var(--alg-text-secondary);
    }

    .badge {
      position: absolute;
      top: 0;
      right: 0;
      min-width: 1rem;
      height: 1rem;
      padding: 0 0.25rem;
      font-size: 0.625rem;
      font-weight: 600;
      line-height: 1rem;
      text-align: center;
      color: white;
      background-color: var(--alg-primary-color, #4a6cf5);
      border-radius: 0.5rem;

      &.error {
        background-color: #e74c3c;
      }
    }
  ` ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBellComponent {
  private notificationsState = this.store.selectSignal(fromNotification.selectNotificationsState);

  isError = computed(() => this.notificationsState()?.isError ?? false);

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

  constructor(private store: Store) {}
}
