import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { SECONDS } from 'src/app/shared/helpers/duration';

@Component({
  selector: 'alg-task-loader',
  templateUrl: './task-loader.component.html',
  styleUrls: [ './task-loader.component.scss' ]
})
export class TaskLoaderComponent implements OnInit, OnDestroy {

  @Input() label = '';
  /** label displayed after a delay (by default 5s) */
  @Input() delayedLabel?: string;
  /** delay in seconds after which the delayedLabel is displayed */
  @Input() delay = 5;

  showDelayedLabel = false;
  subscription?: Subscription;

  constructor() { }

  ngOnInit(): void {
    if (this.delayedLabel) {
      this.subscription = timer(this.delay*SECONDS).subscribe(() => this.showDelayedLabel = true);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

}
