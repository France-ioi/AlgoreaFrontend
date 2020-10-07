import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-progress-level',
  templateUrl: './progress-level.component.html',
  styleUrls: ['./progress-level.component.scss']
})
export class ProgressLevelComponent {

  @Input() theme : 'default' | 'revert' = 'default';
  @Input() value = 0;
  @Input() maximum = 4;

  totalArray : number[]; // array containing [0, 1, 2, ...] as the template cannot iterate by itself

  constructor() {
    this.totalArray = [...Array(this.maximum).keys()];
  }

}
