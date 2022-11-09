import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ActivityNavTreeService, SkillNavTreeService } from 'src/app/core/services/navigation/item-nav-tree.service';
import { isASkill } from 'src/app/shared/helpers/item-type';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { ItemData } from '../../services/item-datasource.service';
import { appConfig } from '../../../../shared/helpers/config';
import { ThreadWrapperService } from '../../services/thread-wrapper.service';
import { combineLatest, ReplaySubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { UserSessionService } from '../../../../shared/services/user-session.service';

@Component({
  selector: 'alg-item-header',
  templateUrl: './item-header.component.html',
  styleUrls: [ './item-header.component.scss' ]
})
export class ItemHeaderComponent implements OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private activityNavigationNeighbors$ = this.activityNavTreeService.navigationNeighbors$;
  private skillNavigationNeighbors$ = this.skillNavTreeService.navigationNeighbors$;
  navigationNeighbors$ = this.activityNavigationNeighbors$;
  threadOpened$ = this.threadWrapperService.opened$;
  session$ = this.sessionService.session$.pipe(delay(0));
  itemData$ = new ReplaySubject<ItemData>();
  showThreadButton$ = combineLatest([
    this.session$,
    this.itemData$,
  ]).pipe(
    map(([ session, itemData ]) =>
      session && !session.tempUser && itemData.item.type === 'Task'
    ),
  );

  showItemThreadWidget = !!appConfig.forumServerUrl;

  constructor(
    private modeService: ModeService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private threadWrapperService: ThreadWrapperService,
    private sessionService: UserSessionService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.itemData) return;
    this.navigationNeighbors$ = isASkill(this.itemData.item) ? this.skillNavigationNeighbors$ : this.activityNavigationNeighbors$;
    this.itemData$.next(this.itemData);
  }

  ngOnDestroy(): void {
    this.itemData$.complete();
  }

  onEditButtonClicked(): void {
    this.modeService.modeActions$.next(ModeAction.StartEditing);
  }

  toggleThread(): void {
    this.threadWrapperService.toggle();
  }

}
