import { Component, Input } from '@angular/core';
import { DescriptionIframeComponent } from 'src/app/ui-components/description-iframe/description-iframe.component';

@Component({
  selector: 'alg-preview-html',
  templateUrl: './preview-html.component.html',
  styleUrls: [ './preview-html.component.scss' ],
  standalone: true,
  imports: [ DescriptionIframeComponent ],
})
export class PreviewHtmlComponent {
  @Input() textContent = '';
}
