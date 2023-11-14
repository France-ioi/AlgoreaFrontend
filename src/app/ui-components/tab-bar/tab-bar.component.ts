import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable, combineLatest, map, fromEvent, Subscription, delay } from 'rxjs';
import { TabService } from '../../services/tab.service';
import { LetDirective } from '@ngrx/component';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'alg-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: [ './tab-bar.component.scss' ],
  standalone: true,
  imports: [ LetDirective, AsyncPipe, NgForOf, NgClass, RouterLink, ButtonModule, NgIf ],
})
export class TabBarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tabsContainer') tabsContainer?: ElementRef<HTMLDivElement>;
  @Input() styleClass?: string;

  showPrevButton = false;
  showNextButton = false;

  tabs$: Observable<MenuItem[]> = combineLatest([ this.tabService.tabs$, this.tabService.activeTab$ ]).pipe(
    map(([ tabs, active ]) => tabs.map(tab => ({
      label: tab.title,
      routerLink: tab.command,
      id: tab.tag,
      styleClass: tab.tag === active ? 'alg-tab-bar-active' : undefined,
    }))),
  );

  readonly subscriptions = new Subscription();

  @HostListener('window:resize')
  resize(): void {
    this.handleArrows();
  }

  constructor(
    private tabService: TabService,
  ) {}

  ngAfterViewInit(): void {
    if (!this.tabsContainer) return;
    this.subscriptions.add(
      fromEvent(this.tabsContainer.nativeElement, 'scroll').pipe(
        debounceTime(30),
      ).subscribe(() =>
        this.handleArrows()
      )
    );
    this.subscriptions.add(
      this.tabs$.pipe(delay(0)).subscribe(() =>
        this.handleArrows()
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onChange(tab: MenuItem): void {
    if (!tab.id) throw new Error('unexpected: the tab should have an id!');
    this.tabService.setActiveTab(tab.id);
  }

  handleArrows(): void {
    const tabsContainer = this.tabsContainer;
    if (!tabsContainer) throw new Error('Unexpected: Missed tabs');
    const scrollWidth = tabsContainer.nativeElement.scrollWidth;
    const boundingClientRect = tabsContainer.nativeElement.getBoundingClientRect();
    const scrollLeft = tabsContainer.nativeElement.scrollLeft;
    const tabContainerWidth = Math.round(boundingClientRect.width);
    const gap = 5;
    this.showPrevButton = Math.round(boundingClientRect.width) !== Math.round(scrollWidth) && scrollLeft > gap;
    this.showNextButton = Math.round(boundingClientRect.width) !== Math.round(scrollWidth)
      && (scrollLeft + tabContainerWidth) < (Math.round(scrollWidth) - gap);
  }

  onPrev(): void {
    const tabsContainer = this.tabsContainer;
    if (!tabsContainer) throw new Error('Unexpected: Missed tabs');
    const boundingClientRect = tabsContainer.nativeElement.getBoundingClientRect();
    const tabContainerWidth = Math.round(boundingClientRect.width);
    tabsContainer.nativeElement.scrollTo({
      left: tabsContainer.nativeElement.scrollLeft - (tabContainerWidth / 2),
      behavior: 'smooth',
    });
  }

  onNext(): void {
    const tabsContainer = this.tabsContainer;
    if (!tabsContainer) throw new Error('Unexpected: Missed tabs');
    const boundingClientRect = tabsContainer.nativeElement.getBoundingClientRect();
    const tabContainerWidth = Math.round(boundingClientRect.width);
    tabsContainer.nativeElement.scrollTo({
      left: tabsContainer.nativeElement.scrollLeft + (tabContainerWidth / 2),
      behavior: 'smooth',
    });
  }
}
