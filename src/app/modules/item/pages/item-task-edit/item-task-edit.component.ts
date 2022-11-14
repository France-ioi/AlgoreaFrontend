import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-item-task-edit',
  templateUrl: './item-task-edit.component.html',
  styleUrls: [ './item-task-edit.component.scss' ]
})
export class ItemTaskEditComponent {
  @Input() editorUrl?: string;

  constructor() {}

}
