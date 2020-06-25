import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'alg-skill-activity-tabs',
  templateUrl: './skill-activity-tabs.component.html',
  styleUrls: ['./skill-activity-tabs.component.scss'],
})
export class SkillActivityTabsComponent implements OnInit, OnChanges {
  @Input() skills;
  @Input() activities;
  @Input() activeTab;

  @Output() tabChange = new EventEmitter<number>();
  @Output() skillSelect = new EventEmitter<any>();
  @Output() activitySelect = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {}

  tabChanged(e) {
    this.tabChange.emit(e.index);
  }

  onSkillSelected(e) {
    this.skillSelect.emit(e);
  }

  onActivitySelected(e) {
    this.activitySelect.emit(e);
  }
}
