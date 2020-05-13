import { Component, OnInit, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-notification-tab',
  templateUrl: './notification-tab.component.html',
  styleUrls: ['./notification-tab.component.scss']
})
export class NotificationTabComponent implements OnInit {

  @Input() data;
  @Input() cols;
  @Input() panels;

  filterChoice = [
    'Add a filter',
    'Range of date',
    'Location',
    'Score range'
  ];

  constructor(
    private elementRef: ElementRef
  ) { }

  ngOnInit() {
  }

  onTabChange(e) {
    const tabs = this.elementRef.nativeElement.querySelectorAll('.mat-tab-labels .mat-tab-label');
    let i;
    const activeTab = this.elementRef.nativeElement.querySelector('.mat-tab-labels .mat-tab-label.mat-tab-label-active');
    tabs.forEach((tab) => {
      tab.classList.remove('mat-tab-label-before-active');
    });

    for (i = 0 ; i < tabs.length ; i++) {
      if (tabs[i] === activeTab) {
        break;
      }
    }

    if (i > 0) {
      tabs[i - 1].classList.add('mat-tab-label-before-active');
    }
  }

  onExpandWidth(e) {

  }

}
