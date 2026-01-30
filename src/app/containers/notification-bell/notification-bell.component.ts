import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Store } from '@ngrx/store';
import { fromNotification } from '../../store/notification';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { RelativeTimePipe } from 'src/app/pipes/relativeTime';

@Component({
  selector: 'alg-notification-bell',
  template: `
    <button class="bell-button" [cdkMenuTriggerFor]="notificationMenu">
      <i class="ph-bold ph-bell"></i>
      <span class="badge" [class.error]="isError()">{{ badgeText() }}</span>
    </button>

    <ng-template #notificationMenu>
      <div class="notification-panel" cdkMenu>
        <div class="panel-header" i18n>Notifications</div>
        @if (isFetching()) {
          <alg-loading class="panel-loading"></alg-loading>
        } @else if (isError()) {
          <alg-error
            class="panel-error"
            i18n-message message="Error loading notifications"
            icon="ph-duotone ph-warning-circle"
          ></alg-error>
        } @else if (notifications().length === 0) {
          <div class="empty-state" i18n>No notifications</div>
        } @else {
          <ul class="notification-list">
            @for (notification of notifications(); track notification.sk) {
              <li class="notification-item" cdkMenuItem>
                <span class="notification-type">{{ notification.notificationType }}</span>
                <span class="notification-time">{{ notification.date | relativeTime }}</span>
              </li>
            }
          </ul>
        }
      </div>
    </ng-template>
  `,
  imports: [ CdkMenuTrigger, CdkMenu, CdkMenuItem, LoadingComponent, ErrorComponent, RelativeTimePipe ],
  styles: [ `
    .bell-button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
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

    .notification-panel {
      width: 300px;
      max-height: 400px;
      overflow-y: auto;
      background-color: var(--alg-bg-primary, white);
      border: 1px solid var(--alg-border-color, #e0e0e0);
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .panel-header {
      padding: 0.75rem 1rem;
      font-weight: 600;
      border-bottom: 1px solid var(--alg-border-color, #e0e0e0);
    }

    .empty-state {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--alg-text-secondary, #666);
    }

    .panel-loading {
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .panel-error {
      padding: 1rem;
    }

    .notification-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .notification-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--alg-border-color, #e0e0e0);
      cursor: pointer;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--alg-bg-secondary, #f5f5f5);
      }
    }

    .notification-type {
      font-weight: 500;
    }

    .notification-time {
      font-size: 0.75rem;
      color: var(--alg-text-secondary, #666);
    }
  ` ],
  changeDetection: ChangeDetectionStrategy.OnPush
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
