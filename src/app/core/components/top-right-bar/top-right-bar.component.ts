import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContentInfo } from 'src/app/shared/models/content/content-info';
import { CurrentContentService } from 'src/app/shared/services/current-content.service';
import { ModeAction, ModeService } from 'src/app/shared/services/mode.service';
import { UserSessionService } from 'src/app/shared/services/user-session.service';

@Component({
  selector: 'alg-top-right-bar[headerDisplayed]',
  templateUrl: './top-right-bar.component.html',
  styleUrls: [ './top-right-bar.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopRightBarComponent implements OnInit, OnDestroy {

  @Input() headerDisplayed!: boolean;

  readonly currentContent$: Observable<ContentInfo | null> = this.currentContent.currentContent$;
  readonly currentMode$ = this.modeService.mode$.asObservable();
  readonly watchedGroupName$ = this.session.watchedGroup$.pipe(map(group => group?.name));

  scrolled = window.pageYOffset > 40;
  onScroll = (): void => {
    const nextScrolled = window.pageYOffset > 40;
    if (nextScrolled !== this.scrolled) {
      this.scrolled = nextScrolled;
      this.changeDetectorRef.detectChanges();
    }
  };

  constructor(
    private currentContent: CurrentContentService,
    private modeService: ModeService,
    private session: UserSessionService,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      globalThis.addEventListener('scroll', this.onScroll);
    });
  }

  ngOnDestroy(): void {
    this.ngZone.runOutsideAngular(() => {
      globalThis.removeEventListener('scroll', this.onScroll);
    });
  }

  onEditCancel() : void{
    this.modeService.modeActions$.next(ModeAction.StopEditing);
  }

  onWatchCancel(): void {
    this.modeService.stopObserving();
  }

}
