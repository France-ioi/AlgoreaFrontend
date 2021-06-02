import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { delay, map, switchMap, filter } from 'rxjs/operators';
import { UserSessionService } from 'src/app/shared/services/user-session.service';
import { ItemData } from '../../services/item-datasource.service';
import { RouterLinkActive } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';
import { ItemType } from '../../../../shared/helpers/item-type';

@Component({
  selector: 'alg-item-progress',
  templateUrl: './item-progress.component.html',
  styleUrls: [ './item-progress.component.scss' ]
})
export class ItemProgressComponent implements OnChanges {

  @Input() itemData?: ItemData;

  @ViewChild('historyTab') historyTab?: RouterLinkActive;
  @ViewChild('chapterGroupProgressTab') chapterGroupProgressTab?: RouterLinkActive;
  @ViewChild('chapterUserProgressTab') chapterUserProgressTab?: RouterLinkActive;

  readonly session$ = this.sessionService.session$.pipe(delay(0));
  private readonly type$ = new ReplaySubject<ItemType>(1);
  readonly selectors$ = this.getSelectors$();
  
  constructor(private sessionService: UserSessionService) {}

  ngOnChanges(): void {
    if (!this.itemData) {
      return;
    }

    this.type$.next(this.itemData.item.type);
  }

  private getSelectors$(): Observable<'none' | 'withUserProgress' | 'withGroupProgress'> {
    return this.type$.pipe(
      filter(type => !!type),
      switchMap(type => this.sessionService.watchedGroup$.pipe(
        map(watchedGroup => {
          if (!watchedGroup && [ 'Task', 'Course' ].includes(type)) {
            return 'none';
          } else if (!watchedGroup && type === 'Chapter') {
            return 'withUserProgress';
          } else {
            return 'withGroupProgress';
          }
        })
      )),
      delay(0)
    )
  }
}
