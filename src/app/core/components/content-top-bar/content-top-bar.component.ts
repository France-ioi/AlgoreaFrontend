import { Component, Input } from '@angular/core';
import { ModeAction, ModeService } from '../../../shared/services/mode.service';
import { ContentInfo } from '../../../shared/models/content/content-info';
import { Observable, of, map, combineLatest } from 'rxjs';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import { delay, switchMap, filter } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { isItemInfo } from '../../../shared/models/content/item-info';
import { FullFrameContent } from 'src/app/shared/services/layout.service';
import { GroupWatchingService } from '../../services/group-watching.service';
import { ThreadWrapperService } from '../../../modules/item/services/thread-wrapper.service';
import { appConfig } from '../../../shared/helpers/config';
import { UserSessionService } from '../../../shared/services/user-session.service';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
})
export class ContentTopBarComponent {
  @Input() fullFrameContent?: FullFrameContent;
  @Input() scrolled = false;

  currentMode$ = this.modeService.mode$.asObservable();
  watchedGroup$ = this.groupWatchingService.watchedGroup$;

  currentContent$: Observable<ContentInfo | null> = this.currentContentService.content$.pipe(
    delay(0),
  );

  navigationNeighbors$ = this.currentContentService.content$.pipe(
    switchMap(content => {
      if (!isItemInfo(content) || !content.route?.contentType) {
        return of(undefined);
      }

      return content.route.contentType === 'activity' ?
        this.activityNavTreeService.navigationNeighbors$ : this.skillNavTreeService.navigationNeighbors$;
    }),
    filter(navigationNeighbors => !!navigationNeighbors?.isReady),
  );

  showItemThreadWidget = !!appConfig.forumServerUrl;

  session$ = this.sessionService.session$.pipe(delay(0));
  showThreadButton$ = combineLatest([
    this.session$,
    this.currentContent$,
  ]).pipe(
    map(([ session, currentContent ]) =>
      session && !session.tempUser && currentContent?.details?.type && [ 'Task', 'Course' ].includes(currentContent.details.type)
    ),
  );
  threadOpened$ = this.threadWrapperService.opened$;

  constructor(
    private modeService: ModeService,
    private groupWatchingService: GroupWatchingService,
    private currentContentService: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private threadWrapperService: ThreadWrapperService,
    private sessionService: UserSessionService,
  ) {
  }

  onEditCancel(): void {
    this.modeService.modeActions$.next(ModeAction.StopEditing);
  }

  toggleThread(): void {
    this.threadWrapperService.toggle();
  }
}
