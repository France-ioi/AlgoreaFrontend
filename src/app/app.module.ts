import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { BasicComponentModule } from './basic-component/basic-component.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { LeftNavComponent } from './left-nav/left-nav.component';
import { NavigationTabsComponent } from './left-nav/navigation-tabs/navigation-tabs.component';
import { TopNavComponent } from './top-nav/top-nav.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { SkillActivityTabsComponent } from './skill-activity-tabs/skill-activity-tabs.component';
import { SearchTabComponent } from './search-tab/search-tab.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { TokenInterceptor } from './shared/services/api/token.interceptor';
import {
  TimeoutInterceptor,
  DEFAULT_TIMEOUT,
} from './shared/services/api/timeout.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
};

@NgModule({
  declarations: [
    AppComponent,
    BreadcrumbComponent,
    SkillActivityTabsComponent,
    LeftNavComponent,
    NavigationTabsComponent,
    TopNavComponent,
    SearchTabComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BreadcrumbModule,
    AccordionModule,
    PerfectScrollbarModule,
    BasicComponentModule,
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimeoutInterceptor,
      multi: true,
    },
    {
      provide: DEFAULT_TIMEOUT,
      useValue: 3000,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
