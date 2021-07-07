import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-section',
  templateUrl: './section.component.html',
  styleUrls: [ './section.component.scss' ],
})
export class SectionComponent {
  @Input() icon?: string; // icon class, for instance a fa icon
  @Input() label = '';
  @Input() hideBorder = false;
  @Input() styleClass = '';

}
