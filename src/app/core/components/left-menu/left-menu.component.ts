import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { readyData } from '../../../shared/operators/state';
import { debounceTime, merge } from 'rxjs';
import { map, filter, distinctUntilChanged } from 'rxjs/operators';
import { isNotUndefined } from '../../../shared/helpers/null-undefined-predicates';
import { GroupNavTreeService } from '../../services/navigation/group-nav-tree.service';

@Component({
  selector: 'alg-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: [ './left-menu.component.scss' ]
})
export class LeftMenuComponent implements OnDestroy {
  @ViewChild(PerfectScrollbarComponent, { static: false }) componentRef?: PerfectScrollbarComponent;

  isNavThemeDark = false;

  private subscription = merge(
    this.activityNavTreeService.state$,
    this.skillNavTreeService.state$,
    this.groupNavTreeService.state$,
  ).pipe(
    readyData(),
    map(navTreeData => navTreeData.selectedElementId),
    filter(isNotUndefined),
    debounceTime(250),
    distinctUntilChanged(),
  ).subscribe(selectedElementId =>
    this.onSelectId(selectedElementId)
  );

  constructor(
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private groupNavTreeService: GroupNavTreeService,
  ) {
  }

  onNavThemeChange(dark: boolean): void {
    this.isNavThemeDark = dark;
  }

  onSelectId(id: string): void {
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
    this.subscription.unsubscribe();
  }

}
