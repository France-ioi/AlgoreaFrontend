import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AngularResizedEventModule } from 'angular-resize-event';

import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { BasicComponentModule } from './basic-component/basic-component.module';
import { ViewComponentModule } from './view-component/view-component.module';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { NavigationTabsComponent } from './left-nav/navigation-tabs/navigation-tabs.component';
import { SkillActivityTabsComponent } from './left-nav/skill-activity-tabs/skill-activity-tabs.component';
import { LeftNavComponent } from './left-nav/left-nav.component';
import { TopNavComponent } from './top-nav/top-nav.component';
import { SearchTabComponent } from './left-nav/search-tab/search-tab.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false
};

@NgModule({
  declarations: [
    AppComponent,
    BreadcrumbComponent,
    NavigationTabsComponent,
    SkillActivityTabsComponent,
    LeftNavComponent,
    TopNavComponent,
    SearchTabComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FontAwesomeModule,
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
