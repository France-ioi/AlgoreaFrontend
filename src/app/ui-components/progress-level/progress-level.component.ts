import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'alg-progress-level',
  templateUrl: './progress-level.component.html',
  styleUrls: [ './progress-level.component.scss' ],
  standalone: true,
  imports: [ NgClass, NgFor, NgIf ]
})
export class ProgressLevelComponent implements OnChanges {

  @Input() theme : 'default' | 'revert' = 'default';
  @Input() value = 0;
  @Input() maximum = 4;
  @Input() colorTheme: 'success' | 'warning' | 'danger' = 'success';

  totalArray : number[] = []; // array containing [0, 1, 2, ...] as the template cannot iterate by itself

  ngOnChanges(_changes: SimpleChanges): void {
    this.totalArray = [ ...Array(this.maximum).keys() ];
  }
}
