import { Component, ViewChild } from '@angular/core';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent {
  @ViewChild(PerfectScrollbarComponent, { static: false }) componentRef?: PerfectScrollbarComponent;

  isNavThemeDark = false;

  onNavThemeChange(event: string | null): void {
    this.isNavThemeDark = event === 'dark';
  }

  onSelectId(id: string): void {
    setTimeout(() => {
      this.componentRef?.directiveRef?.scrollToElement(`#nav-${ id }`, -8, 300);
    });
  }

}
