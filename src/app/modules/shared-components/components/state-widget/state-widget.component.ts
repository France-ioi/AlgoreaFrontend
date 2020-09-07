import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-state-widget',
  templateUrl: './state-widget.component.html',
  styleUrls: ['./state-widget.component.scss'],
})
export class StateWidgetComponent implements OnInit {
  @Input() icon: string;
  @Input() type: number;
  @Input() disabled = false;

  labels = ['Discovery', 'Practice', 'Validation', 'Challenge', 'Review'];

  classes = ['discovery', 'practice', 'validation', 'challenge', 'review'];

  constructor() {}

  ngOnInit() {}
}
