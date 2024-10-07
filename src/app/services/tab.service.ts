import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, shareReplay, startWith, Subject } from 'rxjs';
import { UrlCommand } from '../utils/url';

interface Tab {
  title: string,
  command: UrlCommand,
  exactpathMatch?: boolean,
  tag: string,
}

@Injectable({
  providedIn: 'root'
})
export class TabService implements OnDestroy {

  private tabs = new BehaviorSubject<Tab[]>([]);
  tabs$ = this.tabs.asObservable();

  shouldDisplayTabBar$ = this.tabs.pipe(map(tabs => tabs.length > 1));

  private selectedTab = new Subject<string>(); // the manually selected tab stream

  activeTab$ = combineLatest({
    selectedTabTag: this.selectedTab.pipe(startWith(undefined)),
    routerNavigationEnd: this.router.events.pipe(filter(event => event instanceof NavigationEnd), startWith(undefined)),
    tabs: this.tabs,
  }).pipe(
    map(({ selectedTabTag, tabs }) => {
      /**
       * The active tab (the one highlighed and the page shown) is the one matching the current url.
       * If none matches, fallback to the first tab.
       * If several match, select the one matching the latest manually selected tab.
       */
      const tabsMatchingActiveRoute = tabs.filter(t => this.isTabLinkActive(t));
      if (tabsMatchingActiveRoute.length === 0) return tabs[0];
      if (tabsMatchingActiveRoute.length === 1) return tabsMatchingActiveRoute[0];
      const tabMatchingRouteAndSelected = tabsMatchingActiveRoute.find(t => t.tag === selectedTabTag);
      return tabMatchingRouteAndSelected ? tabMatchingRouteAndSelected : tabsMatchingActiveRoute[0];
    }),
    map(tab => tab?.tag),
    distinctUntilChanged(),
    shareReplay(1),
  );

  constructor(
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    this.tabs.complete();
    this.selectedTab.complete();
  }

  setTabs(tabs: Tab[]): void {
    this.tabs.next(tabs);
  }

  setActiveTab(tag: string): void {
    this.selectedTab.next(tag);
  }

  private isTabLinkActive(tab: Tab): boolean {
    const urlTree = this.router.createUrlTree(tab.command);
    return this.router.isActive(urlTree, {
      paths: tab.exactpathMatch ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

}
