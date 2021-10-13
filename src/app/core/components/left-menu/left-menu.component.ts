import { Component, ElementRef, ViewChild } from '@angular/core';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent {
  @ViewChild(PerfectScrollbarComponent, { static: false }) componentRef?: PerfectScrollbarComponent;

  isNavThemeDark = false;

  onNavThemeChange(dark: boolean): void {
    this.isNavThemeDark = dark;
  }

  onSelectId(id: string): void {
    setTimeout(() => {
      const scrollbarDirectiveRef = this.componentRef?.directiveRef;
      if (!scrollbarDirectiveRef) return;
      const scrollbarElement = (scrollbarDirectiveRef.elementRef as ElementRef<HTMLElement>).nativeElement;

      const menuItemEl = scrollbarElement.querySelector<HTMLElement>(`#nav-${ id }`);
      if (!menuItemEl) return;

      if (menuItemEl.offsetTop - scrollbarElement.scrollTop <= 0) {
        scrollbarDirectiveRef.scrollToElement(`#nav-${ id }`, -8, 300);
      }
    }, 250);
  }

}
