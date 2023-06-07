import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { debounceTime, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent implements OnDestroy {
  @ViewChild(PerfectScrollbarComponent, { static: false }) componentRef?: PerfectScrollbarComponent;

  menuSearchDisabled = environment.featureFlags.menuSearchDisabled;

  private selectedElement$ = new Subject<string>();

  private subscription = this.selectedElement$.pipe(debounceTime(250)).subscribe(id => this.scrollToContent(id));

  onSelectedElementChange(id: string | undefined): void {
    if (id !== undefined) this.selectedElement$.next(id);
  }

  private scrollToContent(id: string): void {
    const scrollbarDirectiveRef = this.componentRef?.directiveRef;
    if (!scrollbarDirectiveRef) return;
    const scrollbarElement = (scrollbarDirectiveRef.elementRef as ElementRef<HTMLElement>).nativeElement;
    const menuItemEl = scrollbarElement.querySelector<HTMLElement>(`#nav-${ id }`);

    if (!menuItemEl) return;

    if ((menuItemEl.offsetTop + menuItemEl.offsetHeight) >= (scrollbarElement.offsetHeight + scrollbarElement.scrollTop)
      || menuItemEl.offsetTop - scrollbarElement.scrollTop <= 0) {
      scrollbarDirectiveRef.scrollToElement(`#nav-${ id }`, -8, 300);
    }
  }

  ngOnDestroy(): void {
    this.selectedElement$.unsubscribe();
    this.subscription.unsubscribe();
  }

}
