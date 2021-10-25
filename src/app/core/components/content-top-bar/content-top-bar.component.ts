import { Component, Input } from '@angular/core';
import { ModeAction, ModeService } from '../../../shared/services/mode.service';
import { ContentInfo } from '../../../shared/models/content/content-info';
import { Observable, of } from 'rxjs';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import { delay, switchMap } from 'rxjs/operators';
import { ActivityNavTreeService, SkillNavTreeService } from '../../services/navigation/item-nav-tree.service';
import { isItemInfo } from '../../../shared/models/content/item-info';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
})
export class ContentTopBarComponent {
  @Input() fullFrameContent = false;
  @Input() scrolled = false;

  currentMode$ = this.modeService.mode$.asObservable();

  currentContent$: Observable<ContentInfo | null> = this.currentContentService.content$.pipe(
    delay(0),
  );

  navigationNeighbors$ = this.currentContent.content$.pipe(
    switchMap(content => {
      if (!isItemInfo(content) || !content.route?.contentType) {
        return of(undefined);
      }

      return content.route.contentType === 'activity' ?
        this.activityNavTreeService.navigationNeighbors$ : this.skillNavTreeService.navigationNeighbors$;
    }),
  );

  constructor(
    private modeService: ModeService,
    private currentContentService: CurrentContentService,
    private activityNavTreeService: ActivityNavTreeService,
    private skillNavTreeService: SkillNavTreeService,
    private currentContent: CurrentContentService,
  ) {
  }

  onEditCancel(): void {
    this.modeService.modeActions$.next(ModeAction.StopEditing);
  }
}
