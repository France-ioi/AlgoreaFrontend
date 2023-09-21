import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GroupWatchingService } from '../../../../core/services/group-watching.service';
import { GetThreadsService } from '../../services/get-threads.service';
import { ReplaySubject, switchMap, combineLatest, Subject, first } from 'rxjs';
import { mapToFetchState } from '../../../../shared/operators/state';
import { distinctUntilChanged, filter, map, startWith, withLatestFrom } from 'rxjs/operators';
import { ItemRouter } from '../../../../shared/routing/item-router';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Item } from '../../http-services/get-item-by-id.service';
import { DiscussionService } from '../../services/discussion.service';


enum ForumTabUrls {
  MyThreads= '/forum/my-threads',
  Others = '/forum/others',
  Group = '/forum/group',
}

const OPTIONS = [
  {
    label: $localize`My threads`,
    value: ForumTabUrls.MyThreads,
  },
  {
    label: $localize`Other's`,
    value: ForumTabUrls.Others,
  },
];

@Component({
  selector: 'alg-item-forum',
  templateUrl: './item-forum.component.html',
  styleUrls: [ './item-forum.component.scss' ],
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
  currentThreadInfo$ = this.discussionService.threadId$;
  isDiscussionVisible$ = this.discussionService.visible$;

  constructor(
    private groupWatchingService: GroupWatchingService,
    private getThreadService: GetThreadsService,
    private itemRouter: ItemRouter,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private discussionService: DiscussionService,
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

  /**
   * Toggle visibily of the thread panel, optionally force the thead displayed
   */
  toggleVisibility(visible: boolean, thread?: Parameters<DiscussionService['toggleVisibility']>[1]): void {
    this.discussionService.toggleVisibility(visible, thread);
  }


}
