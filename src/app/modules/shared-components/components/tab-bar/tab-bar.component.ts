import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Observable, combineLatest, map } from 'rxjs';
import { TabService } from 'src/app/shared/services/tab.service';

@Component({
  selector: 'alg-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: [ './tab-bar.component.scss' ],
})
export class TabBarComponent {
  @Input() styleClass?: string;

  tabs$: Observable<MenuItem[]> = combineLatest([ this.tabService.tabs$, this.tabService.activeTab$ ]).pipe(
    map(([ tabs, active ]) => tabs.map(tab => ({
      label: tab.title,
      routerLink: tab.command,
      id: tab.tag,
      styleClass: tab.tag === active ? 'alg-tab-bar-active' : undefined,
    }))),
  );

  constructor(
    private tabService: TabService,
  ) {}

  onChange(tab: MenuItem): void {
    if (!tab.id) throw new Error('unexpected: the tab should have an id!');
    this.tabService.setActiveTab(tab.id);
  }

}
