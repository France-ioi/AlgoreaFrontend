import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-ioi-tab',
  templateUrl: './ioi-tab.component.html',
  styleUrls: ['./ioi-tab.component.scss'],
})
export class IoiTabComponent implements OnInit, OnChanges {
  @Input() items;
  overview;
  personal;
  settings;

  constructor(private elementRef: ElementRef) { }

  refresh() {
    this.overview = this.items.overview;
    this.personal = this.items.personal;
    this.settings = this.items.settings;
  }

  ngOnInit() {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.refresh();
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

}
