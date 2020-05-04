import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ModuleWithProviders } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { NavigationTabsComponent } from './left-nav/navigation-tabs/navigation-tabs.component';
import { SkillActivityTabsComponent } from './left-nav/skill-activity-tabs/skill-activity-tabs.component';
import { LeftNavComponent } from './left-nav/left-nav.component';
import { TopNavComponent } from './top-nav/top-nav.component';
import { SearchTabComponent } from './left-nav/search-tab/search-tab.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';
import { PerfectScrollbarModule, PerfectScrollbarConfigInterface, PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { AngularResizedEventModule } from 'angular-resize-event';
import { CoreModule } from 'core';
import { ViewComponentModule } from './view-component/view-component.module';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false
};

const providers = [
];

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
    AppRoutingModule,
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
    CoreModule,
    ViewComponentModule,
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

@NgModule({})
export class DesignAppModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AppModule,
      providers: providers
    }
  }
}
