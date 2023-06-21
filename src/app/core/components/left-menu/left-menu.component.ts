import { Component, OnDestroy, ViewChild } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { appConfig } from 'src/app/shared/helpers/config';
import { LeftNavComponent } from '../left-nav/left-nav.component';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent implements OnDestroy {
  @ViewChild(LeftNavComponent, { static: false }) componentRef?: LeftNavComponent;

  menuSearchEnabled = !!appConfig.searchApiUrl;

  private selectedElement$ = new Subject<string>();

  searchQuery = '';

  private subscription = this.selectedElement$.pipe(debounceTime(250)).subscribe(id => this.scrollToContent(id));

  onSelectedElementChange(id: string | undefined): void {
    if (id !== undefined) this.selectedElement$.next(id);
  }

  private scrollToContent(id: string): void {
    const scrollbarDirectiveRef = this.componentRef?.scrollbarRef;
    if (!scrollbarDirectiveRef) return;
    const scrollbarElement = scrollbarDirectiveRef.nativeElement;
    const menuItemEl = scrollbarElement.querySelector<HTMLElement>(`#nav-${ id }`);

    if (!menuItemEl) return;

    if ((menuItemEl.offsetTop + menuItemEl.offsetHeight) >= (scrollbarElement.offsetHeight + scrollbarElement.scrollTop)
      || menuItemEl.offsetTop - scrollbarElement.scrollTop <= 0) {
      scrollbarDirectiveRef.scrollToElement(`#nav-${ id }`);
    }
  }

  ngOnDestroy(): void {
    this.selectedElement$.unsubscribe();
    this.subscription.unsubscribe();
  }

}
