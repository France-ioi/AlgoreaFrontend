import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { SimpleComponentsModule } from '../modules/simple-components/simple-components.module';

import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { LeftNavComponent } from './components/left-nav/left-nav.component';
import { NavigationTabsComponent } from './components//navigation-tabs/navigation-tabs.component';
import { TopNavComponent } from './components/top-nav/top-nav.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BreadcrumbComponent } from './components//breadcrumb/breadcrumb.component';
import { SkillActivityTabsComponent } from './components//skill-activity-tabs/skill-activity-tabs.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { TokenInterceptor } from '../shared/interceptors/token.interceptor';
import {
  TimeoutInterceptor,
  DEFAULT_TIMEOUT,
} from '../shared/interceptors/timeout.interceptor';

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    BreadcrumbModule,
    AccordionModule,
    PerfectScrollbarModule,
    SimpleComponentsModule,
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
