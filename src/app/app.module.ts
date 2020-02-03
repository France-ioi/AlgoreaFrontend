import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgDragDropModule } from 'ng-drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AngularResizedEventModule } from 'angular-resize-event';

import { TreeModule } from 'primeng/tree';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { BasicComponentModule } from './basic-component/basic-component.module';
import { ViewComponentModule } from './view-component/view-component.module';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { PickListComponent } from './pick-list/pick-list.component';
import { SelectionTreeComponent } from './selection-tree/selection-tree.component';
import { GroupNavigationTreeComponent } from './group-navigation-tree/group-navigation.component';
import { ItemsNavigationTreeComponent } from './items-navigation-tree/items-navigation-tree.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { NavigationTabsComponent } from './navigation-tabs/navigation-tabs.component';
import { SkillActivityTabsComponent } from './skill-activity-tabs/skill-activity-tabs.component';
import { LeftNavComponent } from './left-nav/left-nav.component';
import { TopNavComponent } from './top-nav/top-nav.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false
};

@NgModule({
  declarations: [
    AppComponent,
    PickListComponent,
    SelectionTreeComponent,
    GroupNavigationTreeComponent,
    ItemsNavigationTreeComponent,
    BreadcrumbComponent,
    NavigationTabsComponent,
    SkillActivityTabsComponent,
    LeftNavComponent,
    TopNavComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NgDragDropModule.forRoot(),
    FontAwesomeModule,
    TreeModule,
    BreadcrumbModule,
    AccordionModule,
    TabViewModule,
    PerfectScrollbarModule,
    ScrollPanelModule,
    AngularResizedEventModule,
    BasicComponentModule,
    ViewComponentModule
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
