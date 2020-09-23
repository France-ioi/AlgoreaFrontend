import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-progress-level',
  templateUrl: './progress-level.component.html',
  styleUrls: ['./progress-level.component.scss']
})
export class ProgressLevelComponent {

  @Input() size = 12;
  @Input() theme : 'default' | 'revert' = 'default';
  @Input() filled = 0;
  @Input() total = 4;

  constructor() {}

  totalArray() {
    return [...Array(this.total).keys()];
  }

}
