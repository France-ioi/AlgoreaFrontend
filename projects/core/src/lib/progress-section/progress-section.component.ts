import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'lib-progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: ['./progress-section.component.scss'],
})
export class ProgressSectionComponent implements OnInit {
  @Input() collapsed = true;
  @Input() data;

  constructor() {}

  ngOnInit() {}

  onCollapse(e) {
    this.collapsed = !this.collapsed;
  }

  onSwitchChange(e, item) {
    item.checked = !item.checked;
  }

  onSetActive(e, item, idx) {
    item.active_until = idx + 1;
  }
}
