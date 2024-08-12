import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable, combineLatest, map, Subscription, Subject, merge, fromEvent } from 'rxjs';
import { TabService } from '../../services/tab.service';
import { LetDirective } from '@ngrx/component';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { debounceTime } from 'rxjs/operators';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'alg-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: [ './tab-bar.component.scss' ],
  standalone: true,
  imports: [ LetDirective, AsyncPipe, NgForOf, NgClass, RouterLink, ButtonModule, NgIf, NgScrollbar ],
})
export class TabBarComponent implements AfterViewInit, OnDestroy {
  @ViewChild(NgScrollbar, { static: false }) scrollbarRef?: NgScrollbar;
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

  resizeEvent = new Subject<void>();
  resizeObserver = new ResizeObserver(() =>
    this.resizeEvent.next()
  );

  readonly subscriptions = new Subscription();

  @HostListener('window:resize')
  resize(): void {
    this.handleArrows();
  }

  constructor(
    private tabService: TabService,
    private elementRef: ElementRef<HTMLDivElement>,
    private cd: ChangeDetectorRef,
  ) {}

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

  onChange(tab: MenuItem): void {
    if (!tab.id) throw new Error('unexpected: the tab should have an id!');
    this.tabService.setActiveTab(tab.id);
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
