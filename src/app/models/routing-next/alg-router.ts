import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ContentRoute } from './content-route';
import { Store } from '@ngrx/store';
import { fromRouter } from 'src/app/store/router';
import { map, switchMap, take, timeout } from 'rxjs';

interface NavigateOptions {
  preventFullFrame?: boolean,
  navExtras?: NavigationExtras,
}

@Injectable({
  providedIn: 'root'
})
export class AlgRouter {

  constructor(
    private router: Router,
    private store: Store,
  ) {}

  navigateTo(route: ContentRoute, {
    navExtras,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    preventFullFrame = Boolean(typeof history.state === 'object' && history.state?.preventFullFrame),
  }: NavigateOptions = {}): void {
    this.store.select(fromRouter.selectCurrentContentRoute).pipe(
      take(1),
      timeout(1), // unexpected
      map(current => route.urlCommand(current)),
      switchMap(dest => this.router.navigate(dest, { ...navExtras, state: { ...navExtras?.state, preventFullFrame } }))
    ).subscribe();
  }

}
