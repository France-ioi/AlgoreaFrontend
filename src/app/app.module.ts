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

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { PickListComponent } from './pick-list/pick-list.component';
import { SkillProgressComponent } from './skill-progress/skill-progress.component';
import { ScoreRingComponent } from './score-ring/score-ring.component';
import { TreeSelectionDialogComponent } from './tree-selection-dialog/tree-selection-dialog.component';
import { GroupNavigationTreeComponent } from './group-navigation-tree/group-navigation.component';
import { TreeNavigationComponent } from './tree-navigation/tree-navigation.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { NavigationTabsComponent } from './navigation-tabs/navigation-tabs.component';
import { SkillActivityComponent } from './skill-activity/skill-activity.component';
import { LeftNavComponent } from './left-nav/left-nav.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false
};

@NgModule({
  declarations: [
    AppComponent,
    PickListComponent,
    SkillProgressComponent,
    ScoreRingComponent,
    TreeSelectionDialogComponent,
    GroupNavigationTreeComponent,
    TreeNavigationComponent,
    BreadcrumbComponent,
    NavigationTabsComponent,
    SkillActivityComponent,
    LeftNavComponent
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
    AngularResizedEventModule
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
