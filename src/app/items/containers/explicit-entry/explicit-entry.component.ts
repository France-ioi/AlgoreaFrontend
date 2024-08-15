import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { IsTeamActivityPipe } from '../../models/team-activity';

@Component({
  selector: 'alg-explicit-entry',
  standalone: true,
  imports: [
    IsTeamActivityPipe
  ],
  templateUrl: './explicit-entry.component.html',
  styleUrl: './explicit-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExplicitEntryComponent {
  itemData = input.required<ItemData>();
}
