import { Component, OnInit, ElementRef } from '@angular/core';

@Component({
  selector: 'app-yourself-tab',
  templateUrl: './yourself-tab.component.html',
  styleUrls: ['./yourself-tab.component.scss']
})
export class YourselfTabComponent implements OnInit {

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

}
