import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-skill-activity',
  templateUrl: './skill-activity.component.html',
  styleUrls: ['./skill-activity.component.scss']
})
export class SkillActivityComponent implements OnInit {

  @Input() data;
  @Input() activeTab;

  @Output() tabChange = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
  }

  tabChanged(e) {
    this.tabChange.emit(e.index);
  }

}
