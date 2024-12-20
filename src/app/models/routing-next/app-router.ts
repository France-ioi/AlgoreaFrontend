import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { ContentRoute } from './content-route';
import { deserializeContentRoute } from './content-route-serializer';

interface NavigateOptions {
  preventFullFrame?: boolean,
  navExtras?: NavigationExtras,
}

@Injectable({
  providedIn: 'root'
})
export class AppRouter {

  constructor(
    private router: Router,
  ) {}

  navigateTo(route: ContentRoute, {
    navExtras,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    preventFullFrame = Boolean(typeof history.state === 'object' && history.state?.preventFullFrame),
  }: NavigateOptions = {}): void {
    const currentRoute = deserializeContentRoute(this.router.url);
    const routeWithCurrentPage = route.withPageFrom(currentRoute);
    void this.router.navigate(routeWithCurrentPage.urlCommand(), { ...navExtras, state: { ...navExtras?.state, preventFullFrame } });
  }

}
