import { ChangeDetectionStrategy, Component, inject, Pipe, PipeTransform } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { fromCommunity } from '../../store';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';

@Pipe({ name: 'compactNumber', pure: true })
export class CompactNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value >= 1000) {
      const k = Math.round(value / 100) / 10;
      return `${Number.isInteger(k) ? k.toString() : k.toFixed(1)}k`;
    }
    return value.toLocaleString();
  }
}

@Component({
  selector: 'alg-community-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    LoadingComponent,
    ErrorComponent,
    CompactNumberPipe,
  ],
  styleUrl: './community-stats.component.scss',
  template: `
    <h2 class="pulse-title" i18n>Platform Pulse</h2>

    @if (statsState$ | async; as statsState) {
      @if (statsState.isFetching) {
        <alg-loading />
      } @else if (statsState.isError) {
        <alg-error
          i18n-message message="Unable to load statistics."
          icon="ph-duotone ph-warning-circle"
        />
      } @else if (statsState.isReady) {
        <div class="stat-card">
          <h3 class="stat-card-title" i18n>Tasks Validated</h3>
          <div class="stat-card-body">
            <div class="stat-main">
              <span class="stat-number">{{ statsState.data.validations.last24h }}</span>
              <span class="stat-period">/24h</span>
            </div>
            <span class="stat-badge">
              {{ statsState.data.validations.last30d | compactNumber }}<span class="stat-badge-period"> /30d</span>
            </span>
          </div>
        </div>

        <div class="stat-card">
          <h3 class="stat-card-title" i18n>Active Users</h3>
          <div class="stat-card-body">
            <div class="stat-main">
              <span class="stat-number">{{ statsState.data.activeUsers.last24h }}</span>
              <span class="stat-period">/24h</span>
            </div>
            <span class="stat-badge">
              {{ statsState.data.activeUsers.last30d | compactNumber }}<span class="stat-badge-period"> /30d</span>
            </span>
          </div>
        </div>

        <div class="stat-card">
          <h3 class="stat-card-title" i18n>Connected Now</h3>
          @let connectedUsers = statsState.data.connectedUsers < 1 ? 1 : statsState.data.connectedUsers;
          <div class="stat-card-body">
            <span class="stat-number stat-number--large">
              {{ connectedUsers }}
              <span class="stat-unit" i18n>{connectedUsers, plural, =1 {user} other {users}}</span>
            </span>
          </div>
        </div>
      }
    }
  `,
})
export class CommunityStatsComponent {
  private store = inject(Store);
  statsState$ = this.store.select(fromCommunity.selectStatsState);
}
