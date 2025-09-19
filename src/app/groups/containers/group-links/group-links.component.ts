import { Component, input, Input } from '@angular/core';
import { GroupShortInfo } from '../../models/group';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, SlicePipe } from '@angular/common';

const defaultMaxItemsDisplay = 4;

@Component({
  selector: 'alg-group-links',
  templateUrl: './group-links.component.html',
  styleUrls: [ './group-links.component.scss' ],
  standalone: true,
  imports: [ NgFor, RouterLink, NgIf, SlicePipe, GroupLinkPipe ]
})
export class GroupLinksComponent {
  @Input() items?: GroupShortInfo[];
  maxItemsDisplay = input(defaultMaxItemsDisplay);

  constructor() { }

}
