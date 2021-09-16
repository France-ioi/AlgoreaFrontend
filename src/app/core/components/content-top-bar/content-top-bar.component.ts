import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-content-top-bar',
  templateUrl: './content-top-bar.component.html',
  styleUrls: [ './content-top-bar.component.scss' ],
})
export class ContentTopBarComponent {
  @Input() fullFrameContent?: boolean;
  @Input() currentMode?: string;
  @Input() currentContent?: any;
  @Input() scrolled?: boolean;

  onEditCancel(): void {}
}
