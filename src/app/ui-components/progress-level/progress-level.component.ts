import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'alg-progress-level',
  templateUrl: './progress-level.component.html',
  styleUrl: './progress-level.component.scss',
})
export class ProgressLevelComponent {
  value = input(0);
  valuesLength = input(4);
  colorTheme = input<'success' | 'warning' | 'danger'>('success');

  // array containing [0, 1, 2, ...] as the template cannot iterate by itself
  protected readonly totalArray = computed(() => [ ...Array(this.valuesLength() - 1).keys() ]);
}
