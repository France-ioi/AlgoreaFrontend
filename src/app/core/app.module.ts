import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { SharedComponentsModule } from '../modules/shared-components/shared-components.module';

import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { LeftHeaderComponent } from './components/left-header/left-header.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BreadcrumbComponent } from './components//breadcrumb/breadcrumb.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AuthTokenInjector } from '../shared/interceptors/auth_token_injector.interceptor';
import {
  TimeoutInterceptor,
  DEFAULT_TIMEOUT,
} from '../shared/interceptors/timeout.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TreeModule } from 'primeng/tree';
import { LeftNavTreeComponent } from './components/left-nav-tree/left-nav-tree.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UnauthorizedResponseInterceptor } from '../shared/interceptors/unauthorized_response.interceptor';
import { ReactiveComponentModule } from '@ngrx/component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { LanguagePickerComponent } from './components/language-picker/language-picker.component';
import { LeftMenuComponent } from './components/left-menu/left-menu.component';
import { LeftNavComponent } from './components/left-nav/left-nav.component';
import { TopRightControlsComponent } from './components/top-right-controls/top-right-controls.component';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { TopRightMenuComponent } from './components/top-right-menu/top-right-menu.component';
import { FormsModule } from '@angular/forms';

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
    LanguagePickerComponent,
    TopRightControlsComponent,
    TopRightMenuComponent,
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
    DialogModule,
    DropdownModule,
    MenuModule,
    FormsModule,
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
