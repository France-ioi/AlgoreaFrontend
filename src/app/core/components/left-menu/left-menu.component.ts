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

  onNavThemeChange(event: string | null): void {
    this.isNavThemeDark = event === 'dark';
  }

  onSelectId(id: string): void {
    setTimeout(() => {
      if (!this.componentRef?.directiveRef?.elementRef) {
        return;
      }

      const elRef = <ElementRef<HTMLElement>> this.componentRef?.directiveRef?.elementRef;
      const scrollTop: number = elRef.nativeElement.scrollTop;
      const menuItemEl: HTMLElement | null = elRef.nativeElement.querySelector(`#nav-${ id }`);

      if (!menuItemEl?.offsetTop) {
        return;
      }

      const menuItemOffsetTop = menuItemEl.offsetTop;

      if ((menuItemOffsetTop - scrollTop) <= 0) {
        this.componentRef?.directiveRef?.scrollToElement(`#nav-${ id }`, -8, 300);
      }
    }, 250);
  }

}
