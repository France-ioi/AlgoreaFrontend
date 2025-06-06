import { Component, Input } from '@angular/core';
import { Group } from '../../models/group';
import { GroupLinksComponent } from '../group-links/group-links.component';
import { NgSwitch, NgSwitchCase } from '@angular/common';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'alg-group-indicator',
  templateUrl: './group-indicator.component.html',
  styleUrls: [ './group-indicator.component.scss' ],
  standalone: true,
  imports: [ NgSwitch, NgSwitchCase, GroupLinksComponent, NgScrollbar ]
})
export class GroupIndicatorComponent {
  @Input() group?: Group;

  constructor() { }
}
