import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { SharedComponentsModule } from '../modules/shared-components/shared-components.module';

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

import { AuthTokenInjector } from '../shared/interceptors/auth_token_injector.interceptor';
import {
  TimeoutInterceptor,
  DEFAULT_TIMEOUT,
} from '../shared/interceptors/timeout.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GroupNavComponent } from './components/group-nav/group-nav.component';
import { GroupNavTreeComponent } from './components/group-nav-tree/group-nav-tree.component';
import { TreeModule } from 'primeng/tree';
import { ItemNavTreeComponent } from './components/item-nav-tree/item-nav-tree.component';
import { ItemNavComponent } from './components/item-nav/item-nav.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UnauthorizedResponseInterceptor } from '../shared/interceptors/unauthorized_response.interceptor';
import { ReactiveComponentModule } from '@ngrx/component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
};

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    BreadcrumbComponent,
    SkillActivityTabsComponent,
    LeftNavComponent,
    NavigationTabsComponent,
    TopNavComponent,
    GroupNavComponent,
    GroupNavTreeComponent,
    ItemNavComponent,
    ItemNavTreeComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveComponentModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    BreadcrumbModule,
    AccordionModule,
    PerfectScrollbarModule,
    SharedComponentsModule,
    TreeModule,
    ProgressSpinnerModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [
    ConfirmationService,
    MessageService,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimeoutInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthTokenInjector,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedResponseInterceptor,
      multi: true,
    },
    {
      provide: DEFAULT_TIMEOUT,
      useValue: 3000,
    },
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
