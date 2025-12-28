import { Component, input, signal } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { NgClass } from '@angular/common';

export interface SortEvent {
  field: string,
  order: 0 | 1 | -1,
}

@Component({
  selector: 'th[alg-table-sort-header]',
  templateUrl: './table-sort-header.component.html',
  styleUrls: [ './table-sort-header.component.scss' ],
  imports: [ ButtonIconComponent, NgClass ]
})
export class TableSortHeaderComponent {
  sortField = input.required<string>({ alias: 'alg-table-sort-header' });
  sortOrder = signal<SortEvent['order']>(0);
  sortState = signal<SortEvent | undefined>(undefined);
  sortEnabled = input(true);

  toggle(): void {
    this.sortOrder.update(n => (n === 0 ? 1 : n === 1 ? -1 : 0));
    this.sortState.set({
      field: this.sortField(),
      order: this.sortOrder(),
    });
  }
}
