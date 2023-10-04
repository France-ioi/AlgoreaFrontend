import { Component, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'alg-section',
  templateUrl: './section.component.html',
  styleUrls: [ './section.component.scss' ],
  standalone: true,
  imports: [ NgClass, NgIf ],
})
export class SectionComponent {
  @Input() icon?: string; // icon class, for instance a fa icon
  @Input() label = '';
  @Input() hideBorder = false;
  @Input() styleClass = '';

}
