import {
  AfterViewInit, Component, DestroyRef, ElementRef,
  input, OnDestroy, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map, Subject, merge, fromEvent } from 'rxjs';
import { TabService } from '../../services/tab.service';
import { LetDirective } from '@ngrx/component';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { NgScrollbar } from 'ngx-scrollbar';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { UrlCommand } from 'src/app/utils/url';

interface TabView {
  label: string,
  routerLink: UrlCommand,
  id: string,
  isTaskTab: boolean,
  isActive: boolean,
}

type TabBarEntry = {
  kind: 'content-pill',
  tabs: TabView[],
  trackId: string,
  separatorAfterIndex: number | null,
};

const TAB_ICONS: Record<string, string> = {
  task: 'ph ph-file-text',
  editor: 'ph ph-user-gear',
  hints: 'ph ph-lightbulb',
  solution: 'ph ph-check-circle',
  submission: 'ph ph-paper-plane-tilt',
  forum: 'ph ph-chats-circle',
  'alg-content': 'ph ph-article',
  'alg-children-edit': 'ph ph-article',
  'alg-task-edit': 'ph ph-pencil-simple',
  'alg-item-progress': 'ph ph-chart-bar',
  'alg-log': 'ph ph-clock-counter-clockwise',
  'alg-dependencies': 'ph ph-tree-structure',
  'alg-extra-time': 'ph ph-hourglass',
  'alg-parameters': 'ph ph-sliders',
  'alg-forum': 'ph ph-chats-circle',
  'alg-item-stats': 'ph ph-chart-pie',
};

function contentPillSeparatorAfterIndex(tabs: TabView[]): number | null {
  let lastTaskTabIndex = -1;
  tabs.forEach((tab, index) => {
    if (tab.isTaskTab) lastTaskTabIndex = index;
  });
  if (lastTaskTabIndex >= 0 && lastTaskTabIndex < tabs.length - 1) return lastTaskTabIndex;
  return null;
}

function groupTabBarEntries(tabs: TabView[]): TabBarEntry[] {
  if (tabs.length === 0) return [];
  return [ {
    kind: 'content-pill',
    tabs,
    trackId: `content-pill-${tabs.map(tab => tab.id).join('-')}`,
    separatorAfterIndex: contentPillSeparatorAfterIndex(tabs),
  } ];
}

@Component({
  selector: 'alg-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrl: './tab-bar.component.scss',
  host: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '(window:resize)': 'resize()',
  },
  imports: [ LetDirective, RouterLink, NgScrollbar, ButtonIconComponent ]
})
export class TabBarComponent implements AfterViewInit, OnDestroy {
  private tabService = inject(TabService);
  private elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);

  scrollbarRef = viewChild(NgScrollbar);
  styleClass = input<string>();

  showPrevButton = signal(false);
  showNextButton = signal(false);

  tabs$ = combineLatest([ this.tabService.tabs$, this.tabService.activeTab$ ]).pipe(
    map(([ tabs, active ]) => groupTabBarEntries(tabs.map(tab => ({
      label: tab.title,
      routerLink: tab.command,
      id: tab.tag,
      isTaskTab: !!tab.isTaskTab,
      isActive: tab.tag === active,
    })))),
  );

  resizeEvent = new Subject<void>();
  resizeObserver = new ResizeObserver(() =>
    this.resizeEvent.next()
  );

  resize(): void {
    this.handleArrows();
  }

  ngAfterViewInit(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) return;
    this.resizeObserver.observe(this.elementRef.nativeElement);
    merge(
      this.resizeEvent.asObservable(),
      fromEvent(scrollbar.nativeElement, 'scroll'),
      this.tabs$,
    ).pipe(
      debounceTime(50),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.handleArrows());
  }

  ngOnDestroy(): void {
    this.resizeObserver.unobserve(this.elementRef.nativeElement);
    this.resizeEvent.complete();
  }

  onChange(id: string): void {
    this.tabService.setActiveTab(id);
  }

  getTabIcon(tabId: string): string {
    return TAB_ICONS[tabId] ?? 'ph ph-square';
  }

  handleArrows(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) throw new Error('Unexpected: Missed scrollbar');
    const scrollLeft = scrollbar.nativeElement.scrollLeft;
    const scrollWidth = scrollbar.nativeElement.scrollWidth;
    const clientWidth = scrollbar.nativeElement.clientWidth;
    const gap = 5;
    this.showPrevButton.set(clientWidth !== Math.round(scrollWidth) && scrollLeft > gap);
    this.showNextButton.set(clientWidth !== Math.round(scrollWidth)
      && (scrollLeft + clientWidth) < (Math.round(scrollWidth) - gap));
  }

  onPrev(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) throw new Error('Unexpected: Missed scrollbar');
    const scrollLeft = scrollbar.nativeElement.scrollLeft;
    const clientWidth = scrollbar.nativeElement.clientWidth;
    void scrollbar.scrollTo({
      left: scrollLeft - (clientWidth / 2),
    });
  }

  onNext(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) throw new Error('Unexpected: Missed scrollbar');
    const scrollLeft = scrollbar.nativeElement.scrollLeft;
    const clientWidth = scrollbar.nativeElement.clientWidth;
    void scrollbar.scrollTo({
      left: scrollLeft + (clientWidth / 2),
    });
  }
}
