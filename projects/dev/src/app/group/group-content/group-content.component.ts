import { Component, OnInit, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-group-content',
  templateUrl: './group-content.component.html',
  styleUrls: ['./group-content.component.scss'],
})
export class GroupContentComponent implements OnInit {
  @Input() data;
  @Input() empty;

  @Output() expandWholeWidth = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {}

  onTabChange(e) {
    const tabs = this.elementRef.nativeElement.querySelectorAll(
      '.mat-tab-labels .mat-tab-label'
    );
    const activeTab = this.elementRef.nativeElement.querySelector(
      '.mat-tab-labels .mat-tab-label.mat-tab-label-active'
    );
    tabs.forEach((tab) => {
      tab.classList.remove('mat-tab-label-before-active');
    });

    const i = _.findIndex(tabs, activeTab);
    if (i > 0) {
      tabs[i - 1].classList.add('mat-tab-label-before-active');
    }
  }

  onExpandWidth(e) {
    this.expandWholeWidth.emit(e);
  }
}
