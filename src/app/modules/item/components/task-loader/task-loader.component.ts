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
  @Input() delayedLabel = '';
  @Input() delay = 5;

  showDelayedLabel = false;
  subscription?: Subscription;

  constructor() { }

  ngOnInit(): void {
    this.subscription = timer(this.delay*SECONDS).subscribe(() => {
      this.showDelayedLabel = true;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

}
