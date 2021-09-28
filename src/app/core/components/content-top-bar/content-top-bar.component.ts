import { Component, Input } from '@angular/core';
import { Mode, ModeAction, ModeService } from '../../../shared/services/mode.service';
import { ContentInfo } from '../../../shared/models/content/content-info';
import { Observable } from 'rxjs';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
})
export class ContentTopBarComponent {
  @Input() fullFrameContent = false;
  @Input() currentMode?: Mode;
  @Input() scrolled = false;

  currentContent$: Observable<ContentInfo | null> = this.currentContentService.content$.pipe(
    delay(0),
  );

  constructor(
    private modeService: ModeService,
    private currentContentService: CurrentContentService,
  ) {
  }

  onEditCancel(): void {
    this.modeService.modeActions$.next(ModeAction.StopEditing);
  }
}
