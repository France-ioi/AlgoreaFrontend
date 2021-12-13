import { Component, Input } from '@angular/core';
import { FullFrameContent } from 'src/app/shared/services/layout.service';
import { Mode } from '../../../shared/services/mode.service';

@Component({
  selector: 'alg-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: [ './top-bar.component.scss' ],
})
export class TopBarComponent {
  @Input() scrolled = false;
  @Input() currentMode?: Mode;
  @Input() fullFrameContent?: FullFrameContent;
  @Input() showTopRightControls = true;
}
