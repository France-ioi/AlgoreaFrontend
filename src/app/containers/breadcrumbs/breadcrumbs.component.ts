import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { createSelector, Store } from '@ngrx/store';
import { merge, Subject } from 'rxjs';
import { ContentBreadcrumb } from 'src/app/models/content/content-breadcrumbs';
import { fromCurrentContent } from 'src/app/store/navigation/current-content/current-content.store';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

/**
 * When there is no breadcrumb, use the title as unique breadcrumb
 */
const selectBreadcrumbsDefaultOnTitle = createSelector(
  fromCurrentContent.selectBreadcrumbs,
  fromCurrentContent.selectTitle,
  (breadcrumbs, title) => breadcrumbs ?? (title ? [{ title }] : undefined)
);

/** Delay before closing the collapsed-breadcrumbs menu after pointer leave. */
const MENU_CLOSE_DELAY_MS = 300;

interface MeasureWidths {
  itemWidths: number[],
  separatorWidth: number,
  ellipsisWidth: number,
}

@Component({
  selector: 'alg-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    TooltipDirective,
  ],
})
export class BreadcrumbsComponent implements AfterViewInit, OnDestroy {
  private store = inject(Store);
  private changeDetectorRef = inject(ChangeDetectorRef);

  containerRef = viewChild<ElementRef<HTMLElement>>('breadcrumbContainer');
  measureListRef = viewChild<ElementRef<HTMLElement>>('measureList');
  collapsedMenuTrigger = viewChild<CdkMenuTrigger>('collapsedMenuTrigger');

  readonly breadcrumbs = this.store.selectSignal(selectBreadcrumbsDefaultOnTitle);

  readonly collapsedCount = signal(0);
  readonly lastItemEllipsis = signal(false);

  readonly collapsedBreadcrumbs = computed((): ContentBreadcrumb[] => {
    const crumbs = this.breadcrumbs();
    if (!crumbs) return [];
    return crumbs.slice(0, this.collapsedCount());
  });

  readonly visibleBreadcrumbs = computed((): ContentBreadcrumb[] => {
    const crumbs = this.breadcrumbs();
    if (!crumbs) return [];
    return crumbs.slice(this.collapsedCount());
  });

  readonly showHiddenBreadcrumbsAriaLabel = $localize`Show hidden breadcrumbs`;

  private resizeEvent = new Subject<void>();
  private resizeObserver = new ResizeObserver(() => this.resizeEvent.next());

  private menuCloseTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pendingAnimationFrameId: number | null = null;

  constructor() {
    merge(
      this.resizeEvent.asObservable(),
      toObservable(this.breadcrumbs),
    ).pipe(
      takeUntilDestroyed(),
    ).subscribe(() => this.scheduleCollapsedCountUpdate());
  }

  ngAfterViewInit(): void {
    const container = this.containerRef()?.nativeElement;
    if (container) {
      this.resizeObserver.observe(container);
    }
    this.scheduleCollapsedCountUpdate();
  }

  ngOnDestroy(): void {
    this.cancelCollapsedCountUpdate();
    this.clearMenuCloseTimeout();
    const container = this.containerRef()?.nativeElement;
    if (container) {
      this.resizeObserver.unobserve(container);
    }
    this.resizeEvent.complete();
  }

  onElementClick(breadcrumb: ContentBreadcrumb): void {
    if (breadcrumb.navigateTo) breadcrumb.navigateTo();
  }

  onCollapsedMenuMouseEnter(): void {
    this.clearMenuCloseTimeout();
    this.collapsedMenuTrigger()?.open();
  }

  onCollapsedMenuMouseLeave(): void {
    this.clearMenuCloseTimeout();
    this.menuCloseTimeoutId = setTimeout(() => {
      this.collapsedMenuTrigger()?.close();
      this.menuCloseTimeoutId = null;
    }, MENU_CLOSE_DELAY_MS);
  }

  onCollapsedMenuItemClick(breadcrumb: ContentBreadcrumb): void {
    this.collapsedMenuTrigger()?.close();
    this.onElementClick(breadcrumb);
  }

  isLastBreadcrumb(breadcrumb: ContentBreadcrumb): boolean {
    const crumbs = this.breadcrumbs();
    if (!crumbs?.length) return false;
    return crumbs[crumbs.length - 1] === breadcrumb;
  }

  private scheduleCollapsedCountUpdate(): void {
    this.cancelCollapsedCountUpdate();
    this.pendingAnimationFrameId = requestAnimationFrame(() => {
      this.pendingAnimationFrameId = null;
      this.updateCollapsedCount();
      this.changeDetectorRef.detectChanges();
      this.correctCollapsedCountFromOverflow();
    });
  }

  private cancelCollapsedCountUpdate(): void {
    if (this.pendingAnimationFrameId === null) return;
    cancelAnimationFrame(this.pendingAnimationFrameId);
    this.pendingAnimationFrameId = null;
  }

  private updateCollapsedCount(): void {
    const crumbs = this.breadcrumbs();
    const container = this.containerRef()?.nativeElement;
    const measureList = this.measureListRef()?.nativeElement;
    if (!crumbs?.length || !container || !measureList) return;

    const containerWidth = container.clientWidth;
    const { itemWidths, separatorWidth, ellipsisWidth } = this.readMeasureWidths(measureList);

    let collapsed = 0;
    const maxCollapsed = crumbs.length - 1;

    while (collapsed < maxCollapsed) {
      const width = this.computeVisibleWidth(collapsed, itemWidths, separatorWidth, ellipsisWidth);
      if (width <= containerWidth) break;
      collapsed++;
    }

    this.collapsedCount.set(collapsed);
    this.updateLastItemEllipsis(collapsed, containerWidth, itemWidths, separatorWidth, ellipsisWidth);
  }

  private updateLastItemEllipsis(
    collapsed: number,
    containerWidth: number,
    itemWidths: number[],
    separatorWidth: number,
    ellipsisWidth: number,
  ): void {
    const lastItemWidth = itemWidths[itemWidths.length - 1] ?? 0;
    const lastItemMaxWidth = collapsed > 0
      ? containerWidth - ellipsisWidth - separatorWidth
      : containerWidth;
    this.lastItemEllipsis.set(lastItemWidth > lastItemMaxWidth);
  }

  /** Increase-only: corrects under-collapse when rendered width exceeds the measure-list estimate. */
  private correctCollapsedCountFromOverflow(): void {
    const crumbs = this.breadcrumbs();
    const container = this.containerRef()?.nativeElement;
    const list = container?.querySelector<HTMLElement>('.breadcrumb-list');
    if (!crumbs?.length || !container || !list) return;

    const maxCollapsed = crumbs.length - 1;
    const measureList = this.measureListRef()?.nativeElement;

    while (list.scrollWidth > container.clientWidth && this.collapsedCount() < maxCollapsed) {
      const collapsed = this.collapsedCount() + 1;
      this.collapsedCount.set(collapsed);

      if (measureList) {
        const { itemWidths, separatorWidth, ellipsisWidth } = this.readMeasureWidths(measureList);
        this.updateLastItemEllipsis(collapsed, container.clientWidth, itemWidths, separatorWidth, ellipsisWidth);
      }

      this.changeDetectorRef.detectChanges();
    }
  }

  private readMeasureWidths(measureList: HTMLElement): MeasureWidths {
    const measureItems = measureList.querySelectorAll<HTMLElement>('.measure-item');
    const separator = measureList.querySelector<HTMLElement>('.measure-separator');
    const ellipsis = measureList.querySelector<HTMLElement>('.measure-ellipsis');
    return {
      itemWidths: Array.from(measureItems, item => item.offsetWidth),
      separatorWidth: separator?.offsetWidth ?? 0,
      ellipsisWidth: ellipsis?.offsetWidth ?? 0,
    };
  }

  private computeVisibleWidth(
    collapsedCount: number,
    itemWidths: number[],
    separatorWidth: number,
    ellipsisWidth: number,
  ): number {
    const visibleCount = itemWidths.length - collapsedCount;
    if (visibleCount <= 0) return 0;

    let width = 0;
    if (collapsedCount > 0) {
      width += ellipsisWidth + separatorWidth;
    }
    for (let index = collapsedCount; index < itemWidths.length; index++) {
      if (index > collapsedCount) width += separatorWidth;
      width += itemWidths[index]!;
    }
    return width;
  }

  private clearMenuCloseTimeout(): void {
    if (this.menuCloseTimeoutId === null) return;
    clearTimeout(this.menuCloseTimeoutId);
    this.menuCloseTimeoutId = null;
  }
}
