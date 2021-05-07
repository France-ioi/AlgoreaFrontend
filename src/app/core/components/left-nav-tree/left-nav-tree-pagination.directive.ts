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
import { Subject, timer, fromEvent, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { isNotNullOrUndefined } from '../../../shared/helpers/is-not-null-or-undefined';
import { LeftNavTreeNode } from './left-nav-tree.component';

@Directive({
  selector: '[algLeftNavTreePagination]'
})
export class LeftNavTreePaginationDirective implements AfterViewInit, OnDestroy {
  @ContentChildren(UITreeNode) treeNode!: QueryList<UITreeNode>;

  @Output() clickPaginateButton = new EventEmitter<LeftNavTreeNode>();

  private readonly unsubscribe$ = new Subject<void>();
  subscription?: Subscription;

  loadMoreButton: HTMLElement = this.renderer.createElement('button') as HTMLElement;
  loadMoreButtonText: HTMLElement = this.renderer.createText($localize`...see all subgroups`) as HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Host() @Self() @Optional() public hostTree : Tree,
  ) {}

  ngAfterViewInit(): void {
    timer(100, 0).pipe(
      map(() => this.hostTree.value.find((value: LeftNavTreeNode) => value.type === 'group' && value.data?.current)),
      filter(isNotNullOrUndefined),
      filter((value: LeftNavTreeNode) => !!value.data?.hasMoreChildren),
      distinctUntilChanged(),
      takeUntil(this.unsubscribe$)
    ).subscribe((node: LeftNavTreeNode) => {
      this.renderButton();
      this.onClickListener(node);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  renderButton(): void {
    const treeEl = this.hostTree.el.nativeElement as HTMLElement;
    const treeNodeChildrenEl = treeEl.querySelector('.p-treenode-children');
    const algNavigatePaginationButtonEl = treeEl.querySelector('.alg-navigate-pagination-button');

    if (algNavigatePaginationButtonEl) {
      return;
    }

    this.renderer.appendChild(this.loadMoreButton, this.loadMoreButtonText);
    this.renderer.addClass(this.loadMoreButton, 'alg-navigate-pagination-button');
    this.renderer.appendChild(treeNodeChildrenEl, this.loadMoreButton);
  }

  onClickListener(node: LeftNavTreeNode): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = fromEvent(this.loadMoreButton, 'click')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.clickPaginateButton.emit(node));
  }
}
