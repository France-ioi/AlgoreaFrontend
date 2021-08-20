import { Component, Input, OnChanges } from '@angular/core';
import { GetParticipantProgressService } from '../../http-services/get-participant-progress.service';
import { ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { mapToFetchState } from '../../../../shared/operators/state';

interface Column {
  field: string,
  header: string
}

@Component({
  selector: 'alg-chapter-user-progress',
  templateUrl: './chapter-user-progress.component.html',
  styleUrls: [ './chapter-user-progress.component.scss' ]
})
export class ChapterUserProgressComponent implements OnChanges {
  @Input() id?: string;

  private readonly id$ = new ReplaySubject<string>(1);
  state$ = this.id$.pipe(
    switchMap(id => this.getParticipantProgressService.get(id)),
    mapToFetchState(),
  );

  columns: Column[] = [
    {
      field: 'score',
      header: 'Content',
    },
    {
      field: 'score',
      header: 'Latest activity',
    },
    {
      field: 'score',
      header: 'Time spent',
    },
    {
      field: 'score',
      header: '# subm.',
    },
    {
      field: 'score',
      header: 'Score',
    }
  ];

  constructor(private getParticipantProgressService: GetParticipantProgressService) { }

  ngOnChanges(): void {
    if (this.id) {
      this.id$.next(this.id);
    }
  }

}
