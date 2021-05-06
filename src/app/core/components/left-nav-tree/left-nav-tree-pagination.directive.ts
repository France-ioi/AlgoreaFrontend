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
import { Subject, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';

@Directive({
  selector: '[algLeftNavTreePagination]'
})
export class LeftNavTreePaginationDirective implements AfterViewInit, OnDestroy {
  @ContentChildren(UITreeNode) treeNode!: QueryList<UITreeNode>;

  @Output() clickPaginateButton = new EventEmitter();

  private readonly unsubscribe$ = new Subject<void>();

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Host() @Self() @Optional() public hostTree : Tree,
  ) {}

  ngAfterViewInit(): void {
    console.log('hostTree: ', this.hostTree);

    timer(100, 0).pipe(
      filter(() => this.hostTree.value.some((v: any) => !!v.checked && (v.children || []).length > 1)),
      map(() => this.hostTree.value),
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
  }

}
