import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'lib-progress-level',
  templateUrl: './progress-level.component.html',
  styleUrls: ['./progress-level.component.scss'],
})
export class ProgressLevelComponent implements OnInit {
  Arr = Array;

  @Input() size = 12;
  @Input() theme: 'default' | 'revert' = 'default';
  @Input() filled = 0;
  @Input() total = 4;

  constructor() {}

  ngOnInit() {}
}
