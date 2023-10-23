import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { combineLatest, distinctUntilChanged, filter, of, Subscription, switchMap } from 'rxjs';
import { ThreadComponent } from '../thread/thread.component';
import { GetItemByIdService } from '../../../data-access/get-item-by-id.service';
import { isNotNull } from '../../../utils/null-undefined-predicates';
import { catchError } from 'rxjs/operators';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/pipes/itemRoute';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common';
import { forumActions, forumFeature } from 'src/app/forum/store';
import { Store } from '@ngrx/store';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    ButtonModule,
    ThreadComponent,
    AsyncPipe,
    RawItemRoutePipe,
    RouteUrlPipe,
  ],
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  @Input() topCompensation = 0;

  visible$ = this.store.select(forumFeature.selectVisible);
  readonly threadItem$ = combineLatest([
    this.store.select(forumFeature.selectThreadId).pipe(
      filter(isNotNull),
      distinctUntilChanged((x,y) => x?.participantId === y?.participantId && x?.itemId === y?.itemId),
    ),
    this.visible$.pipe(filter(visible => visible), distinctUntilChanged()),
  ]).pipe(
    switchMap(([ threadId ]) =>
      this.getItemByIdService.get(threadId.itemId).pipe(catchError(() => of(null)))
    ),
  );

  private subscription?: Subscription;

  constructor(
    private store: Store,
    private getItemByIdService: GetItemByIdService,
  ) {
  }

  ngAfterViewInit(): void {
    this.subscription = this.visible$.pipe(filter(visible => visible)).subscribe(() => {
      this.threadComponent?.scrollDown();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onClose(): void {
    this.store.dispatch(forumActions.visibilityChange({ visible: false }));
  }
}
