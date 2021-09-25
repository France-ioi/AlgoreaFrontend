import { Component, Input } from '@angular/core';
import { ModeAction, ModeService } from '../../../shared/services/mode.service';
import { ContentInfo } from '../../../shared/models/content/content-info';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
})
export class ContentTopBarComponent {
  @Input() fullFrameContent?: boolean;
  @Input() currentMode?: string;
  @Input() currentContent?: ContentInfo | null;
  @Input() scrolled = false;

  constructor(private modeService: ModeService) {
  }

  onEditCancel(): void {
    this.modeService.modeActions$.next(ModeAction.StopEditing);
  }
}
