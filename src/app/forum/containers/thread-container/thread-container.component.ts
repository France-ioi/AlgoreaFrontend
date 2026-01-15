import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { filter, Subscription } from 'rxjs';
import { ThreadComponent } from '../thread/thread.component';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { fromForum } from 'src/app/forum/store';
import { Store } from '@ngrx/store';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-thread-container',
  templateUrl: './thread-container.component.html',
  styleUrls: [ './thread-container.component.scss' ],
  imports: [
    RouterLink,
    ThreadComponent,
    AsyncPipe,
    ItemRoutePipe,
    RouteUrlPipe,
    ButtonIconComponent,
  ]
})
export class ThreadContainerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(ThreadComponent) threadComponent?: ThreadComponent;

  @Input() topCompensation = 0;

  visible$ = this.store.select(fromForum.selectVisible);
  threadHydratedId = this.store.selectSignal(fromForum.selectThreadHydratedId);

  private subscription?: Subscription;

  constructor(
    private store: Store,
  ) {
  }

  ngAfterViewInit(): void {
    this.subscription = this.visible$.pipe(filter(visible => visible)).subscribe(() => {
      this.threadComponent?.scrollDown();
      this.threadComponent?.focusOnInput();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onClose(): void {
    this.store.dispatch(fromForum.threadPanelActions.close());
  }
}
