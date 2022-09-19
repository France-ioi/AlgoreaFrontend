import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';

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

import { WithCredentialsInterceptor } from '../shared/interceptors/with_credentials.interceptor';
import { TimeoutInterceptor } from '../shared/interceptors/timeout.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeModule } from 'primeng/tree';
import { LeftNavTreeComponent } from './components/left-nav-tree/left-nav-tree.component';
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
import { AuthenticationInterceptor } from '../shared/interceptors/authentication.interceptor';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
};

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
      useClass: AuthenticationInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: WithCredentialsInterceptor,
      multi: true,
    },
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: true,
      }),
    },
  ],
  exports: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
