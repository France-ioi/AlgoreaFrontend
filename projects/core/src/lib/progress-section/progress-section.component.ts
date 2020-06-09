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

  onCollapse(_e) {
    this.collapsed = !this.collapsed;
  }

  onSwitchChange(_e, item) {
    item.checked = !item.checked;
  }

  onSetActive(_e, item, idx) {
    item.active_until = idx + 1;
  }
}
