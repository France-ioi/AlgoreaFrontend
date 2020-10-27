import { Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'alg-item-progress',
  templateUrl: './item-progress.component.html',
  styleUrls: [ './item-progress.component.scss' ]
})
export class ItemProgressComponent implements OnDestroy {

  constructor() { }

  ngOnDestroy(): void {
  }

}
