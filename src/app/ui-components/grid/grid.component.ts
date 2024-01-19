import { Component, Input, ContentChild, ViewChild, Output, EventEmitter, TemplateRef } from '@angular/core';
import { DomHandler } from 'primeng/dom';
import { Table, TableService, TableModule } from 'primeng/table';
import { SortEvent } from 'primeng/api/sortevent';
import { SortMeta } from 'primeng/api/sortmeta';
import { SwitchComponent } from '../switch/switch.component';
import { SharedModule } from 'primeng/api';
import { NgClass, NgIf, NgTemplateOutlet, NgFor } from '@angular/common';
import { ButtonModule } from 'primeng/button';

export function tableFactory(wrapper: GridComponent): Table|undefined {
  return wrapper.table;
}

export interface GridColumn {
  field: string,
  header: string,
  sortKey?: string,
}

@Component({
  selector: 'alg-grid',
  templateUrl: './grid.component.html',
  styleUrls: [ './grid.component.scss' ],
  providers: [
    DomHandler,
    TableService,
    {
      provide: Table,
      useFactory: tableFactory,
      deps: [ GridComponent ], // new function depends on your wrapper
    },
  ],
  standalone: true,
  imports: [
    TableModule,
    NgClass,
    NgIf,
    SharedModule,
    NgTemplateOutlet,
    NgFor,
    SwitchComponent,
    ButtonModule,
  ],
})
export class GridComponent {
  @Input() selection?: any[];

  @ViewChild('table', { static: true }) table?: Table;

  @Input() data?: any[];
  @Input() selectedColumns?: GridColumn[];
  @Input() columns: GridColumn[] = [];

  @Input() sortMode: 'single' | 'multiple' = 'multiple';
  @Input() multiSortMeta?: SortMeta[];
  @Input() customSort = true;

  @Input() scrollWhenExpanded = false;
  @Input() scrollable = false;

  @Input() selectionMode?: 'single' | 'multiple';
  @Input() dataKey?: string;
  @Input() frozenWidth?: string;
  @Input() loading = false;
  @Input() tableStyle = '';

  @Output() expandWholeWidth = new EventEmitter<boolean>();
  @Output() sort = new EventEmitter<SortEvent>();
  @Output() selectionChange = new EventEmitter<any[]>();

  @ContentChild('headerTemplate') headerTemplate?: TemplateRef<any>;
  @ContentChild('bodyTemplate') bodyTemplate?: TemplateRef<any>;
  @ContentChild('footerTemplate') footerTemplate?: TemplateRef<any>;
  @ContentChild('summaryTemplate') summaryTemplate?: TemplateRef<any>;
  @ContentChild('rowExpansionTemplate') rowExpansionTemplate?: TemplateRef<any>;
  @ContentChild('frozenHeaderTemplate') frozenHeaderTemplate?: TemplateRef<any>;
  @ContentChild('frozenBodyTemplate') frozenBodyTemplate?: TemplateRef<any>;
  @ContentChild('emptymessageTemplate') emptymessageTemplate?: TemplateRef<any>;

  constructor() {}

  onSelectionChange(selection: any[]): void {
    this.selection = selection;
    this.selectionChange.emit(this.selection ?? []);
  }

  onRowSelect(): void {
    this.selectionChange.emit(this.selection ?? []);
  }

  onRowUnselect(): void {
    this.selectionChange.emit(this.selection ?? []);
  }

  sortFunction(event: SortEvent): void {
    this.sort.emit(event);
  }

  onHeaderCheckbox(): void {
    this.selectionChange.emit(this.selection);
  }

  public reset(): void {
    this.table?.clear();
  }
}
