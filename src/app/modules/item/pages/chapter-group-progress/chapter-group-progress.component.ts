import { Component, Input, OnDestroy } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { GetGroupByIdService } from 'src/app/modules/group/http-services/get-group-by-id.service';
import { ItemData } from '../../services/item-datasource.service';
import { mapToFetchState } from '../../../../shared/operators/state';
import { isNotNull } from '../../../../shared/helpers/null-undefined-predicates';
import { Subject } from 'rxjs';
import { GroupWatchingService } from 'src/app/core/services/group-watching.service';
import { ErrorComponent } from '../../../shared-components/components/error/error.component';
import { LoadingComponent } from '../../../shared-components/components/loading/loading.component';
import { GroupProgressGridComponent } from '../group-progress-grid/group-progress-grid.component';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-chapter-group-progress',
  templateUrl: './chapter-group-progress.component.html',
  styleUrls: [ './chapter-group-progress.component.scss' ],
  standalone: true,
  imports: [ NgIf, GroupProgressGridComponent, LoadingComponent, ErrorComponent, AsyncPipe ]
})
export class ChapterGroupProgressComponent implements OnDestroy {

  @Input() itemData?: ItemData;

  private refresh$ = new Subject<void>();
  state$ = this.groupWatchingService.watchedGroup$.pipe(
    filter(isNotNull),
    switchMap(watchedGroup => this.getGroupByIdService.get(watchedGroup.route.id)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor(
    private groupWatchingService: GroupWatchingService,
    private getGroupByIdService: GetGroupByIdService,
  ) {}

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  refresh(): void {
    this.refresh$.next();
  }
}
