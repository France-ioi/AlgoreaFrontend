import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GroupWatchingService } from 'src/app/services/group-watching.service';
import { GetThreadsService } from '../../../data-access/get-threads.service';
import { ReplaySubject, switchMap, combineLatest, Subject, first } from 'rxjs';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { distinctUntilChanged, filter, map, startWith, withLatestFrom } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { Item } from 'src/app/data-access/get-item-by-id.service';
import { ThreadStatusDisplayPipe } from 'src/app/pipes/threadStatusDisplay';
import { UserCaptionPipe } from 'src/app/pipes/userCaption';
import { GroupLinkPipe } from 'src/app/pipes/groupLink';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RawItemRoutePipe } from 'src/app/pipes/itemRoute';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { NgIf, NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import forum from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';


enum ForumTabUrls {
  MyThreads= '/forum/my-threads',
  Others = '/forum/others',
  Group = '/forum/group',
}

const OPTIONS = [
  {
    label: $localize`My help requests`,
    value: ForumTabUrls.MyThreads,
  },
  {
    label: $localize`Other users' requests`,
    value: ForumTabUrls.Others,
  },
];

@Component({
  selector: 'alg-item-forum',
  templateUrl: './item-forum.component.html',
  styleUrls: [ './item-forum.component.scss' ],
  standalone: true,
  imports: [
    LetDirective,
    NgIf,
    SelectionComponent,
    ErrorComponent,
    LoadingComponent,
    ButtonModule,
    TableModule,
    SharedModule,
    NgClass,
    RouterLink,
    AsyncPipe,
    DatePipe,
    RawItemRoutePipe,
    RouteUrlPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    ThreadStatusDisplayPipe,
  ],
})
export class ItemForumComponent implements OnInit, OnChanges, OnDestroy {
  @Input() itemData?: ItemData;

  private readonly url$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => this.router.url),
    startWith(this.router.url),
    distinctUntilChanged(),
  );
  private readonly refresh$ = new Subject<void>();
  private readonly item$ = new ReplaySubject<Item>(1);
  private readonly watchedGroup$ = this.groupWatchingService.watchedGroup$;
  isWatching$ = this.groupWatchingService.isWatching$;
  selected$ = new ReplaySubject<number>(1);
  options$ = combineLatest([
    this.watchedGroup$,
    this.url$,
  ]).pipe(
    map(([ watchedGroup, url ]) => [
      ...OPTIONS,
      ...(watchedGroup || url.endsWith(ForumTabUrls.Group)
        ? [{ label: `${ watchedGroup?.name || $localize`Group` }'s`, value: ForumTabUrls.Group }] : [])
    ]),
  );
  state$ = combineLatest([
    this.selected$,
    this.item$,
    this.watchedGroup$,
  ]).pipe(
    switchMap(([ selected, item, watchedGroup ]) =>
      this.getThreadService.get(item.id, selected === 2 && watchedGroup
        ? { watchedGroupId: watchedGroup.route.id }
        : { isMine: selected === 0 }).pipe(
        mapToFetchState({ resetter: this.refresh$ }),
      ),
    ),
  );
  currentThreadInfo$ = this.store.select(forum.selectThreadId);
  isDiscussionVisible$ = this.store.select(forum.selectVisible);

  constructor(
    private store: Store,
    private groupWatchingService: GroupWatchingService,
    private getThreadService: GetThreadsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
  }

  ngOnChanges(): void {
    if (this.itemData) {
      this.item$.next(this.itemData.item);
    }
  }

  ngOnInit(): void {
    this.url$.pipe(
      withLatestFrom(this.watchedGroup$),
      first(),
    ).subscribe(([ url, watchedGroup ]) => {
      if (watchedGroup || url.endsWith(ForumTabUrls.Group)) {
        this.selected$.next(2);
        return;
      } else if (this.itemData?.currentResult?.validated || url.endsWith(ForumTabUrls.Others)) {
        this.selected$.next(1);
        return;
      }
      this.selected$.next(0);
    });
  }

  ngOnDestroy(): void {
    this.item$.complete();
    this.selected$.complete();
    this.refresh$.complete();
  }

  onChange(selected: number, options: typeof OPTIONS): void {
    if (!this.itemData) {
      throw new Error('Unexpected: Missed item data');
    }
    this.selected$.next(selected);
    const selectedOption = options[selected];
    if (!selectedOption) {
      throw new Error('Unexpected: Missed selected option');
    }
    void this.router.navigate([ `.${ selectedOption.value }` ], { relativeTo: this.activatedRoute });
  }

  refresh(): void {
    this.refresh$.next();
  }

  hideThreadPanel(): void {
    this.store.dispatch(forum.forumThreadListActions.hideCurrentThread());
  }

  showThreadPanel(id: ThreadId): void {
    this.store.dispatch(forum.forumThreadListActions.showAsCurrentThread({ id }));
  }

}
