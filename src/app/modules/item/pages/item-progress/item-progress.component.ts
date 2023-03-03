import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { RouterLinkActive } from '@angular/router';
import { isATask } from '../../../../shared/helpers/item-type';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { map } from 'rxjs/operators';
import { combineLatest, ReplaySubject } from 'rxjs';

@Component({
  selector: 'alg-item-progress',
  templateUrl: './item-progress.component.html',
  styleUrls: [ './item-progress.component.scss' ]
})
export class ItemProgressComponent implements OnChanges {

  @Input() itemData?: ItemData;
  @Input() savingAnswer = false;

  @Output() skipSave = new EventEmitter<void>();

  @ViewChild('historyTab') historyTab?: RouterLinkActive;
  @ViewChild('chapterGroupProgressTab') chapterGroupProgressTab?: RouterLinkActive;
  @ViewChild('chapterUserProgressTab') chapterUserProgressTab?: RouterLinkActive;

  private itemData$ = new ReplaySubject<ItemData>();
  selectors$ = combineLatest([ this.itemData$, this.groupWatchingService.watchedGroup$ ]).pipe(
    map(([ itemData, watchedGroup ]) => {
      if (!watchedGroup || watchedGroup.route.isUser) {
        return isATask(itemData.item) ? 'none' : 'withUserProgress';
      } else {
        return 'withGroupProgress';
      }
    }),
  );

  sectionLabel$ = this.groupWatchingService.watchedGroup$.pipe(
    map(g => (g ? $localize`Situation of ${ g.name }` : $localize`Your situation`))
  );

  isWatching$ = this.groupWatchingService.isWatching$;

  constructor(
    private groupWatchingService: GroupWatchingService,
  ) {}

  ngOnChanges(): void {
    if (this.itemData) this.itemData$.next(this.itemData);
  }

}
