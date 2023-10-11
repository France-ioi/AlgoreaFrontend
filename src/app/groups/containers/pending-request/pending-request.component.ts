import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ContentChild, TemplateRef, Output, EventEmitter
} from '@angular/core';
import { SortEvent } from 'primeng/api/sortevent';
import { GridColumn, GridColumnGroup, GridComponent } from 'src/app/ui-components/grid/grid.component';
import { Action } from 'src/app/groups/data-access/request-actions.service';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { TableModule } from 'primeng/table';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { NgIf, NgTemplateOutlet, NgFor, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault, DatePipe } from '@angular/common';
import { SectionParagraphComponent } from 'src/app/ui-components/section-paragraph/section-paragraph.component';

@Component({
  selector: 'alg-pending-request',
  templateUrl: './pending-request.component.html',
  styleUrls: [ './pending-request.component.scss' ],
  standalone: true,
  imports: [
    SectionParagraphComponent,
    NgIf,
    NgTemplateOutlet,
    ErrorComponent,
    GridComponent,
    NgFor,
    TableModule,
    NgClass,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    LoadingComponent,
    DatePipe,
    UserCaptionPipe,
  ],
})
export class PendingRequestComponent<T> implements OnInit, OnChanges {

  @Input() columns: GridColumn[] = [];
  @Input() requests: T[] = [];
  @Input() state: 'fetching' | 'processing' | 'ready' | 'fetchingError' = 'fetching';
  @Input() label = '';

  @Output() sort = new EventEmitter<string[]>();
  @Output() processRequests = new EventEmitter<{ data: T[], type: Action }>();

  @ContentChild('sectionHeaderTemplate') sectionHeaderTemplate?: TemplateRef<any>;

  selection: T[] = [];
  panel: GridColumnGroup[] = [];
  collapsed = true;

  ngOnInit(): void {
    this.panel.push({
      columns: this.columns,
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.collapsed = this.requests.length === 0;
  }

  onAccept(): void {
    this.onAcceptOrReject(Action.Accept);
  }

  onReject(): void {
    this.onAcceptOrReject(Action.Reject);
  }

  private onAcceptOrReject(action: Action): void {
    if (this.selection.length === 0 || this.state !== 'ready') {
      return;
    }
    this.processRequests.emit({ data: this.selection, type: action });
    this.selection = [];
  }

  onSelectAll(): void {
    if (this.selection.length === this.requests.length) {
      this.selection = [];
    } else {
      this.selection = this.requests;
    }
  }

  onCustomSort(event: SortEvent): void {
    const sortMeta = event.multiSortMeta?.map(meta => (meta.order === -1 ? `-${meta.field}` : meta.field));
    if (sortMeta) this.sort.emit(sortMeta);
  }
}
