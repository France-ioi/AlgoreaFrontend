import {
  AfterViewInit, Component, DestroyRef, ElementRef,
  input, OnDestroy, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
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

type TabBarEntry =
  | { kind: 'tab', tab: TabView, trackId: string }
  | { kind: 'task-segment', tabs: TabView[], trackId: string };

function groupTabBarEntries(tabs: TabView[]): TabBarEntry[] {
  const entries: TabBarEntry[] = [];
  let taskGroup: TabView[] = [];

  const flushTaskGroup = (): void => {
    if (taskGroup.length === 0) return;
    entries.push({
      kind: 'task-segment',
      tabs: taskGroup,
      trackId: `task-segment-${taskGroup.map(tab => tab.id).join('-')}`,
    });
    taskGroup = [];
  };

  for (const tab of tabs) {
    if (tab.isTaskTab) {
      taskGroup.push(tab);
      continue;
    }
    flushTaskGroup();
    entries.push({ kind: 'tab', tab, trackId: tab.id });
  }
  flushTaskGroup();

  return entries;
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

  tabs$ = combineLatest([
    this.tabService.tabs$,
    this.tabService.activeTab$,
    toObservable(this.styleClass),
  ]).pipe(
    map(([ tabs, active, styleClass ]) => {
      const tabViews = tabs.map(tab => ({
        label: tab.title,
        routerLink: tab.command,
        id: tab.tag,
        isTaskTab: !!tab.isTaskTab,
        isActive: tab.tag === active,
      }));
      return styleClass === 'for-header'
        ? groupTabBarEntries(tabViews)
        : tabViews.map(tab => ({ kind: 'tab' as const, tab, trackId: tab.id }));
    }),
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
