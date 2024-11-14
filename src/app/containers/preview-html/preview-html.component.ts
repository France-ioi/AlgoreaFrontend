import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-preview-html',
  templateUrl: './preview-html.component.html',
  styleUrls: [ './preview-html.component.scss' ],
  standalone: true,
})
export class PreviewHtmlComponent {
  @Input() textContent = '';
}
