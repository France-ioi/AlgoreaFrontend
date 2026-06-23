import { Component, effect, input, signal } from '@angular/core';
import { timer } from 'rxjs';
import { SECONDS } from 'src/app/utils/duration';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';


@Component({
  selector: 'alg-task-loader',
  templateUrl: './task-loader.component.html',
  styleUrl: './task-loader.component.scss',
  imports: [ LoadingComponent ]
})
export class TaskLoaderComponent {
  label = input('');
  /** label displayed after a delay (by default 5s) */
  delayedLabel = input<string>();
  /** delay in seconds after which the delayedLabel is displayed */
  delay = input(5);

  showDelayedLabel = signal(false);

  constructor() {
    // effect() restarts the timer when delayedLabel or delay inputs change; a field-initialized
    // timer().pipe(takeUntilDestroyed()) would only run once at construction time.
    effect(onCleanup => {
      const delayedLabel = this.delayedLabel();
      this.showDelayedLabel.set(false);
      if (!delayedLabel) {
        return;
      }
      const sub = timer(this.delay() * SECONDS).subscribe(() => this.showDelayedLabel.set(true));
      onCleanup(() => sub.unsubscribe());
    });
  }
}
