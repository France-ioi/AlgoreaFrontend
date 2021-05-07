import {
  AfterViewInit,
  Directive,
  ElementRef,
  Output,
  Renderer2,
  EventEmitter,
  ContentChildren, QueryList, Optional, Host, Self, OnDestroy
} from '@angular/core';
import { Tree, UITreeNode } from 'primeng/tree';
import { Subject, timer, fromEvent } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { isNotNullOrUndefined } from '../../../shared/helpers/is-not-null-or-undefined';
import { LeftNavTreeNode } from './left-nav-tree.component';

@Directive({
  selector: '[algLeftNavTreePagination]'
})
export class LeftNavTreePaginationDirective implements AfterViewInit, OnDestroy {
  @ContentChildren(UITreeNode) treeNode!: QueryList<UITreeNode>;

  @Output() clickPaginateButton = new EventEmitter<Event>();

  private readonly unsubscribe$ = new Subject<void>();

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Host() @Self() @Optional() public hostTree : Tree,
  ) {}

  ngAfterViewInit(): void {
    console.log('hostTree: ', this.hostTree);

    timer(100, 0).pipe(
      map(() => this.hostTree.value.find((value: LeftNavTreeNode) => value.type === 'group' && value.data?.current)),
      filter(isNotNullOrUndefined),
      filter((value: LeftNavTreeNode) => (value.children || []).length > 6),
      distinctUntilChanged(),
      tap(console.log),
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.renderButton();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  renderButton(): void {
    if (this.hostTree.el.nativeElement.querySelector('.alg-navigate-pagination-button')) {
      return;
    }

    const loadMoreButton: HTMLElement = this.renderer.createElement('button') as HTMLElement;
    const loadMoreButtonText: HTMLElement = this.renderer.createText('...see all subgroups') as HTMLElement;

    this.renderer.appendChild(loadMoreButton, loadMoreButtonText);
    this.renderer.addClass(loadMoreButton, 'alg-navigate-pagination-button');
    this.renderer.appendChild(this.hostTree.el.nativeElement.querySelector('.p-treenode-children'), loadMoreButton);
    this.onClickListener(loadMoreButton);
  }

  onClickListener(loadMoreButton: HTMLElement): void {
    fromEvent(loadMoreButton, 'click')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((e: Event) => this.clickPaginateButton.emit(e), () => {}, () => console.log('complete'));
  }
}
