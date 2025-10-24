import { contentChildren, Directive, effect, output } from '@angular/core';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { SortEvent, TableSortHeaderComponent } from 'src/app/ui-components/table-sort/table-sort-header/table-sort-header.component';

@Directive({
  selector: '[algTableSort]',
  standalone: true,
})
export class TableSortDirective {
  sortChange = output<SortEvent[]>();

  sortHeaderChildren = contentChildren(TableSortHeaderComponent);

  emitChangesEff = effect(() => {
    const sortEvents = this.sortHeaderChildren().map(c => c.sortState()).filter(isNotUndefined);
    if (sortEvents.length > 0) {
      this.sortChange.emit(sortEvents);
    }
  });

}
