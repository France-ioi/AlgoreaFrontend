import {
  AfterViewInit, Component, DestroyRef, ElementRef,
  input, OnDestroy, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map, Subject, merge, fromEvent, shareReplay } from 'rxjs';
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
  icon: string,
  isTaskTab: boolean,
  isActive: boolean,
}

interface TabBarView {
  tabs: TabView[],
  separatorAfterIndex: number | null,
}

/** Minimum scroll offset before showing the previous/next arrow. */
const SCROLL_EDGE_GAP_PX = 5;
/** Scroll step as a fraction of the visible viewport width. */
const SCROLL_STEP_VIEWPORT_RATIO = 0.5;
/** Sub-pixel tolerance when comparing scrollWidth to clientWidth. */
const SCROLL_OVERFLOW_TOLERANCE_PX = 1;

function contentPillSeparatorAfterIndex(tabs: TabView[]): number | null {
  let lastTaskTabIndex = -1;
  tabs.forEach((tab, index) => {
    if (tab.isTaskTab) lastTaskTabIndex = index;
  });
  if (lastTaskTabIndex >= 0 && lastTaskTabIndex < tabs.length - 1) return lastTaskTabIndex;
  return null;
}

function buildTabBarView(tabs: TabView[]): TabBarView | null {
  if (tabs.length === 0) return null;
  return {
    tabs,
    separatorAfterIndex: contentPillSeparatorAfterIndex(tabs),
  };
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
  indicatorVisible = signal(false);
  indicatorLeft = signal(0);
  indicatorTop = signal(0);
  indicatorWidth = signal(0);
  indicatorHeight = signal(0);
  indicatorAnimate = signal(false);
  private indicatorInitialized = false;
  private indicatorUpdateGeneration = 0;

  readonly navAriaLabel = $localize`Item navigation`;

  tabBarView$ = combineLatest([ this.tabService.tabs$, this.tabService.activeTab$ ]).pipe(
    map(([ tabs, active ]) => buildTabBarView(tabs.map(tab => ({
      label: tab.title,
      routerLink: tab.command,
      id: tab.tag,
      icon: tab.icon,
      isTaskTab: !!tab.isTaskTab,
      isActive: tab.tag === active,
    })))),
    shareReplay(1),
  );

  resizeEvent = new Subject<void>();
  resizeObserver = new ResizeObserver(() =>
    this.resizeEvent.next()
  );

  resize(): void {
    this.handleArrows();
    this.updateActiveIndicator();
  }

  ngAfterViewInit(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) return;
    const viewport = scrollbar.adapter.viewportElement;
    this.resizeObserver.observe(this.elementRef.nativeElement);
    merge(
      this.resizeEvent.asObservable(),
      fromEvent(viewport, 'scroll'),
      this.tabBarView$,
    ).pipe(
      debounceTime(50),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.handleArrows();
      this.scheduleActiveIndicatorUpdate();
    });
    this.scheduleActiveIndicatorUpdate(false);
  }

  ngOnDestroy(): void {
    this.indicatorUpdateGeneration += 1;
    this.resizeObserver.unobserve(this.elementRef.nativeElement);
    this.resizeEvent.complete();
  }

  onChange(id: string): void {
    this.tabService.setActiveTab(id);
  }

  private scheduleActiveIndicatorUpdate(animate = true): void {
    const generation = ++this.indicatorUpdateGeneration;
    requestAnimationFrame(() => {
      if (generation !== this.indicatorUpdateGeneration) return;
      this.updateActiveIndicator(animate);
    });
  }

  private updateActiveIndicator(animate = true): void {
    const listEl = this.elementRef.nativeElement.querySelector('.content-pill-list');
    const activeEl = listEl?.querySelector('.content-pill-item.alg-tab-bar-active') as HTMLElement | null;
    if (!listEl || !activeEl) {
      this.indicatorVisible.set(false);
      return;
    }
    this.indicatorAnimate.set(animate && this.indicatorInitialized);
    this.indicatorLeft.set(activeEl.offsetLeft);
    this.indicatorTop.set(activeEl.offsetTop);
    this.indicatorWidth.set(activeEl.offsetWidth);
    this.indicatorHeight.set(activeEl.offsetHeight);
    this.indicatorVisible.set(true);
    this.indicatorInitialized = true;
  }

  handleArrows(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) throw new Error('Unexpected: Missed scrollbar');
    const viewport = scrollbar.adapter.viewportElement;
    const scrollLeft = viewport.scrollLeft;
    const scrollWidth = viewport.scrollWidth;
    const clientWidth = viewport.clientWidth;
    const hasOverflow = clientWidth < scrollWidth - SCROLL_OVERFLOW_TOLERANCE_PX;
    this.showPrevButton.set(hasOverflow && scrollLeft > SCROLL_EDGE_GAP_PX);
    this.showNextButton.set(hasOverflow && (scrollLeft + clientWidth) < (scrollWidth - SCROLL_EDGE_GAP_PX));
  }

  onPrev(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) throw new Error('Unexpected: Missed scrollbar');
    const viewport = scrollbar.adapter.viewportElement;
    const targetLeft = Math.max(0, viewport.scrollLeft - viewport.clientWidth * SCROLL_STEP_VIEWPORT_RATIO);
    void scrollbar.scrollTo({ left: targetLeft }).then(() => {
      this.handleArrows();
      this.updateActiveIndicator();
    });
  }

  onNext(): void {
    const scrollbar = this.scrollbarRef();
    if (!scrollbar) throw new Error('Unexpected: Missed scrollbar');
    const viewport = scrollbar.adapter.viewportElement;
    const targetLeft = viewport.scrollLeft + viewport.clientWidth * SCROLL_STEP_VIEWPORT_RATIO;
    void scrollbar.scrollTo({ left: targetLeft }).then(() => {
      this.handleArrows();
      this.updateActiveIndicator();
    });
  }
}
