import { Component, input } from '@angular/core';

@Component({
  selector: 'alg-empty-content',
  templateUrl: './empty-content.component.html',
  styleUrls: [ './empty-content.component.scss' ],
})
export class EmptyContentComponent {
  icon = input.required<string>();
  message = input.required<string>();
}
