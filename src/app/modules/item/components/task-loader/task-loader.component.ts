import { Component, Input } from '@angular/core';

@Component({
  selector: 'alg-task-loader',
  templateUrl: './task-loader.component.html',
  styleUrls: [ './task-loader.component.scss' ]
})
export class TaskLoaderComponent {

  @Input() label = '';

  constructor() { }

}
