import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TooltipDirective, TooltipPosition } from 'src/app/ui-components/tooltip/tooltip.directive';
import { LocaleService } from 'src/app/services/localeService';
import { computeRefreshInterval, formatRelativeTime } from 'src/app/utils/format-relative-time';

@Component({
  selector: 'alg-relative-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ DatePipe, TooltipDirective ],
  template: `
    <span
      [algTooltip]="(value() | date: 'dd/MM/yyyy h:mm:ss a zzzz')!"
      [tooltipPosition]="tooltipPosition()"
      tooltipStyleClass="no-text-wrap"
    >{{ formattedTime() }}</span>
  `,
})
export class RelativeTimeComponent {
  value = input.required<string | Date>();
  tooltipPosition = input<TooltipPosition>('bottom');

  private destroyRef = inject(DestroyRef);
  private locale = inject(LocaleService).currentLang?.tag ?? 'en';
  private tick = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  formattedTime = computed(() => {
    this.tick();
    return formatRelativeTime(this.value(), this.locale);
  });

  constructor() {
    effect(() => {
      const val = this.value();
      this.tick();
      this.clearTimer();
      this.startTimer(val);
    });
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  private startTimer(value: string | Date): void {
    const ms = computeRefreshInterval(value);
    this.intervalId = setInterval(() => {
      this.tick.update(t => t + 1);
      const newMs = computeRefreshInterval(value);
      if (newMs !== ms) {
        this.clearTimer();
        this.startTimer(value);
      }
    }, ms);
  }

  private clearTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
