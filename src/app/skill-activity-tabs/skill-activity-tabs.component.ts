import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-skill-activity-tabs',
  templateUrl: './skill-activity-tabs.component.html',
  styleUrls: ['./skill-activity-tabs.component.scss']
})
export class SkillActivityTabsComponent implements OnInit {

  @Input() skills;
  @Input() activities;
  @Input() activeTab;

  @Output() tabChange = new EventEmitter<number>();
  @Output() skillSelect = new EventEmitter<any>();
  @Output() activitySelect = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  tabChanged(e) {
    this.tabChange.emit(e.index);
  }

  onSkillSelected(e) {
    console.log(e);
    this.skillSelect.emit(e);
  }

  onActivitySelected(e) {
    this.activitySelect.emit(e);
    // console.log(e);
  }

}
