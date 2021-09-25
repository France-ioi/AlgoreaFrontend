import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ContentInfo } from '../../../shared/models/content/content-info';
import { delay } from 'rxjs/operators';
import { CurrentContentService } from '../../../shared/services/current-content.service';
import { Mode } from '../../../shared/services/mode.service';

@Component({
  selector: 'alg-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: [ './top-bar.component.scss' ],
})
export class TopBarComponent {
  @Input() scrolled = false;
  @Input() currentMode?: Mode;
  @Input() fullFrameContent?: boolean;

  currentContent$: Observable<ContentInfo|null> = this.currentContent.content$.pipe(delay(0));

  constructor(
    private currentContent: CurrentContentService,
  ) {}

}
