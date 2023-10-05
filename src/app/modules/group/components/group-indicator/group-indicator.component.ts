import { Component, Input } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';
import { GroupLinksComponent } from '../group-links/group-links.component';
import { NgSwitch, NgSwitchCase } from '@angular/common';

@Component({
  selector: 'alg-group-indicator',
  templateUrl: './group-indicator.component.html',
  styleUrls: [ './group-indicator.component.scss' ],
  standalone: true,
  imports: [ NgSwitch, NgSwitchCase, GroupLinksComponent ]
})
export class GroupIndicatorComponent {
  @Input() group?: Group;

  constructor() { }
}
