import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';

import { SharedComponentsModule } from '../modules/shared-components/shared-components.module';

import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { LeftHeaderComponent } from './components/left-header/left-header.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AuthTokenInjector } from '../shared/interceptors/auth_token_injector.interceptor';
import { CredentialsInterceptor } from '../shared/interceptors/credentials.interceptor';
import {
  TimeoutInterceptor,
  DEFAULT_TIMEOUT,
} from '../shared/interceptors/timeout.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeModule } from 'primeng/tree';
import { LeftNavTreeComponent } from './components/left-nav-tree/left-nav-tree.component';
import { UnauthorizedResponseInterceptor } from '../shared/interceptors/unauthorized_response.interceptor';
import { ReactiveComponentModule } from '@ngrx/component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { LeftMenuComponent } from './components/left-menu/left-menu.component';
import { LeftNavComponent } from './components/left-nav/left-nav.component';
import { TopRightControlsComponent } from './components/top-right-controls/top-right-controls.component';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { TopRightMenuComponent } from './components/top-right-menu/top-right-menu.component';
import { FormsModule } from '@angular/forms';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ObservationBarComponent } from './components/observation-bar/observation-bar.component';
import { LanguageMismatchComponent } from './components/language-mismatch/language-mismatch.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { ContentTopBarComponent } from './components/content-top-bar/content-top-bar.component';
import * as Sentry from '@sentry/angular';
import { Router } from '@angular/router';
import { appConfig } from '../shared/helpers/config';
import { APP_BASE_HREF } from '@angular/common';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
};

const sentryProviders = appConfig.sentryDsn ? [
  {
    provide: ErrorHandler,
    useValue: Sentry.createErrorHandler({
      showDialog: true,
    }),
  },
  {
    provide: Sentry.TraceService,
    deps: [ Router ],
  },
  {
    provide: APP_INITIALIZER,
    useFactory: () => (): void => {},
    deps: [ Sentry.TraceService ],
    multi: true,
  },
] : [];

@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    BreadcrumbComponent,
    LeftMenuComponent,
    LeftNavComponent,
    LeftHeaderComponent,
    LeftNavTreeComponent,
    TopRightControlsComponent,
    TopRightMenuComponent,
    ObservationBarComponent,
    LanguageMismatchComponent,
    TopBarComponent,
    ContentTopBarComponent,
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
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    MenuModule,
    FormsModule,
    ConfirmPopupModule,
  ],
  providers: [
    ConfirmationService,
    MessageService,
    {
      provide: APP_BASE_HREF,
      useValue: new URL(globalThis.location.pathname, globalThis.location.href).href,
    },
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
      useClass: CredentialsInterceptor,
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
    ...sentryProviders
  ],
  exports: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
