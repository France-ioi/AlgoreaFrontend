import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild, inject } from '@angular/core';
import { combineLatest, map, Subscription, Subject, merge, fromEvent } from 'rxjs';
import { TabService } from '../../services/tab.service';
import { LetDirective } from '@ngrx/component';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { NgScrollbar } from 'ngx-scrollbar';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { UrlCommand } from 'src/app/utils/url';

@Component({
  selector: 'alg-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: [ './tab-bar.component.scss' ],
  imports: [ LetDirective, NgClass, RouterLink, NgScrollbar, ButtonIconComponent, SelectionComponent ]
})
export class TabBarComponent implements AfterViewInit, OnDestroy {
  private tabService = inject(TabService);
  private elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);
  private cd = inject(ChangeDetectorRef);
  private router = inject(Router);

  @ViewChild(NgScrollbar, { static: false }) scrollbarRef?: NgScrollbar;
  @Input() styleClass?: string;

  showPrevButton = false;
  showNextButton = false;

  // Task tabs for segmented button
  taskTabs$ = combineLatest([ this.tabService.tabs$, this.tabService.activeTab$ ]).pipe(
    map(([ tabs, active ]) => {
      const taskTabs = tabs.filter(tab => tab.isTaskTab);
      const activeIndex = taskTabs.findIndex(tab => tab.tag === active);
      return {
        items: taskTabs.map(tab => ({ label: tab.title, value: tab.tag, routerLink: tab.command })),
        selectedIndex: activeIndex >= 0 ? activeIndex : 0,
      };
    }),
  );

  // Regular tabs (non-task tabs)
  regularTabs$ = combineLatest([ this.tabService.tabs$, this.tabService.activeTab$ ]).pipe(
    map(([ tabs, active ]) => tabs.filter(tab => !tab.isTaskTab).map(tab => ({
      label: tab.title,
      routerLink: tab.command,
      id: tab.tag,
      styleClass: tab.tag === active ? 'alg-tab-bar-active' : undefined,
    }))),
  );

  tabs$ = combineLatest([ this.tabService.tabs$, this.tabService.activeTab$ ]).pipe(
    map(([ tabs, active ]) => tabs.map(tab => {
      const classes: string[] = [];
      if (tab.tag === active) classes.push('alg-tab-bar-active');
      if (tab.isTaskTab) classes.push('alg-task-tab');
      return {
        label: tab.title,
        routerLink: tab.command,
        id: tab.tag,
        styleClass: classes.length > 0 ? classes.join(' ') : undefined,
      };
    })),
  );

  resizeEvent = new Subject<void>();
  resizeObserver = new ResizeObserver(() =>
    this.resizeEvent.next()
  );

  readonly subscriptions = new Subscription();

  @HostListener('window:resize')
  resize(): void {
    this.handleArrows();
  }

  ngAfterViewInit(): void {
    if (!this.scrollbarRef) return;
    this.resizeObserver.observe(this.elementRef.nativeElement);
    this.subscriptions.add(
      merge(
        this.resizeEvent.asObservable(),
        fromEvent(this.scrollbarRef.viewport.nativeElement, 'scroll'),
        this.tabs$,
      ).pipe(
        debounceTime(50),
      ).subscribe(() =>
        this.handleArrows()
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.resizeObserver.unobserve(this.elementRef.nativeElement);
    this.resizeEvent.complete();
  }

  onChange(id: string): void {
    this.tabService.setActiveTab(id);
  }

  onTaskTabChange(index: number, items: { label: string, value: string, routerLink: UrlCommand }[]): void {
    const item = items[index];
    if (item) {
      this.tabService.setActiveTab(item.value);
      void this.router.navigate(item.routerLink as string[]);
    }
  }

  handleArrows(): void {
    if (!this.scrollbarRef) throw new Error('Unexpected: Missed scrollbar');
    const scrollLeft = this.scrollbarRef.nativeElement.scrollLeft;
    const scrollWidth = this.scrollbarRef.nativeElement.scrollWidth;
    const clientWidth = this.scrollbarRef.nativeElement.clientWidth;
    const gap = 5;
    this.showPrevButton = clientWidth !== Math.round(scrollWidth) && scrollLeft > gap;
    this.showNextButton = clientWidth !== Math.round(scrollWidth)
      && (scrollLeft + clientWidth) < (Math.round(scrollWidth) - gap);
    this.cd.detectChanges();
  }

  onPrev(): void {
    if (!this.scrollbarRef) throw new Error('Unexpected: Missed scrollbar');
    const scrollLeft = this.scrollbarRef.nativeElement.scrollLeft;
    const clientWidth = this.scrollbarRef.nativeElement.clientWidth;
    void this.scrollbarRef.scrollTo({
      left: scrollLeft - (clientWidth / 2),
    });
  }

  onNext(): void {
    if (!this.scrollbarRef) throw new Error('Unexpected: Missed scrollbar');
    const scrollLeft = this.scrollbarRef.nativeElement.scrollLeft;
    const clientWidth = this.scrollbarRef.nativeElement.clientWidth;
    void this.scrollbarRef.scrollTo({
      left: scrollLeft + (clientWidth / 2),
    });
  }
}
