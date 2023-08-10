import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map, startWith, withLatestFrom } from 'rxjs';
import { UrlCommand } from '../helpers/url';

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

  private activeTab = new BehaviorSubject<string|undefined>(undefined);
  activeTab$ = this.activeTab.asObservable();

  subscription = combineLatest([
    this.tabs$,
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => {}), startWith(undefined)),
  ]).pipe(
    withLatestFrom(this.activeTab$)
  ).subscribe(([ [ tabs ], activeTab ]) => {
    // if the new url does not match the active tab, change tab
    const currentTab = tabs.find(t => t.tag === activeTab);
    if (!currentTab || !this.isTabLinkActive(currentTab)) {
      // find the first tab matching the current route
      const matchingTab = tabs.find(t => this.isTabLinkActive(t));
      if (matchingTab) this.activeTab.next(matchingTab.tag);
    }
  });

  constructor(
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    this.tabs.complete();
    this.activeTab.complete();
    this.subscription.unsubscribe();
  }

  setTabs(tabs: Tab[]): void {
    this.tabs.next(tabs);
    const activeTab = this.activeTab.value;
    // if the active tab is not among the tabs anymore OR if there was no active tab and tabs have changed: select the first tab as active
    if ((activeTab !== undefined && !tagInTabs(activeTab, tabs)) || !activeTab) {
      this.activeTab.next(tabs[0]?.tag); // set no active tab if there is no tabs
    }
  }

  setActiveTab(tag: string|undefined): void {
    this.activeTab.next(tag);
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

function tagInTabs(tag: string, tabs: Tab[]): boolean {
  return tabs.some(tab => tab.tag === tag);
}
