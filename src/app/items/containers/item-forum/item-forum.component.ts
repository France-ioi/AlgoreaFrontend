import { Component, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { ItemData } from '../../models/item-data';
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
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { SelectionComponent } from 'src/app/ui-components/selection/selection.component';
import { NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { LetDirective } from '@ngrx/component';
import { Store } from '@ngrx/store';
import { fromForum } from 'src/app/forum/store';
import { ThreadId } from 'src/app/forum/models/threads';
import { fromObservation } from 'src/app/store/observation';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { RawItemRoute } from 'src/app/models/routing/item-route';


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
  imports: [
    LetDirective,
    SelectionComponent,
    ErrorComponent,
    LoadingComponent,
    NgClass,
    RouterLink,
    AsyncPipe,
    DatePipe,
    ItemRoutePipe,
    RouteUrlPipe,
    GroupLinkPipe,
    UserCaptionPipe,
    ThreadStatusDisplayPipe,
    ButtonComponent,
  ]
})
export class ItemForumComponent implements OnInit, OnChanges, OnDestroy {
  private store = inject(Store);
  private getThreadService = inject(GetThreadsService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  @Input() itemData?: ItemData;

  private readonly url$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => this.router.url),
    startWith(this.router.url),
    distinctUntilChanged(),
  );
  private readonly refresh$ = new Subject<void>();
  private readonly item$ = new ReplaySubject<Item>(1);
  isObserving$ = this.store.select(fromObservation.selectIsObserving);
  selected$ = new ReplaySubject<number>(1);
  options$ = combineLatest([
    this.store.select(fromObservation.selectObservedGroupInfo),
    this.url$,
  ]).pipe(
    map(([ observedGroup, url ]) => [
      ...OPTIONS,
      ...(observedGroup || url.endsWith(ForumTabUrls.Group)
        ? [{ label: `${ observedGroup?.name || $localize`Group` }'s`, value: ForumTabUrls.Group }] : [])
    ]),
  );
  state$ = combineLatest([
    this.selected$,
    this.item$,
    this.store.select(fromObservation.selectObservedGroupId)
  ]).pipe(
    switchMap(([ selected, item, watchedGroupId ]) =>
      this.getThreadService.get(item.id, selected === 2 && watchedGroupId ? { watchedGroupId } : { isMine: selected === 0 }).pipe(
        mapToFetchState({ resetter: this.refresh$ }),
      ),
    ),
  );
  currentThreadInfo$ = this.store.select(fromForum.selectThreadId);
  isDiscussionVisible$ = this.store.select(fromForum.selectVisible);

  ngOnChanges(): void {
    if (this.itemData) {
      this.item$.next(this.itemData.item);
    }
  }

  ngOnInit(): void {
    this.url$.pipe(
      withLatestFrom(this.store.select(fromObservation.selectObservedGroupId)),
      first(),
    ).subscribe(([ url, observedGroupId ]) => {
      if (observedGroupId || url.endsWith(ForumTabUrls.Group)) {
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
    this.store.dispatch(fromForum.forumThreadListActions.hideCurrentThread());
  }

  showThreadPanel(id: ThreadId, item: { title: string, route: RawItemRoute }): void {
    this.store.dispatch(
      fromForum.forumThreadListActions.showAsCurrentThread({ id, item })
    );
  }

}
