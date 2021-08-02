import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { LeftNavScrollService } from '../../services/left-nav-scroll.service';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent implements AfterViewInit {
  @ViewChild(PerfectScrollbarComponent, { static: false }) componentRef?: PerfectScrollbarComponent;

  isNavThemeDark = false;

  constructor(private leftNavScrollService: LeftNavScrollService) {
  }

  ngAfterViewInit(): void {
    if (!this.componentRef?.directiveRef) {
      return;
    }

    this.leftNavScrollService.registerScroll(this.componentRef.directiveRef);
  }

  onNavThemeChange(event: string | null): void {
    this.isNavThemeDark = event === 'dark';
  }

}
