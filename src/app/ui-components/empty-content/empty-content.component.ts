import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-empty-content',
  templateUrl: './empty-content.component.html',
  styleUrls: [ './empty-content.component.scss' ],
  standalone: true,
})
export class EmptyContentComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) message!: string;
}
