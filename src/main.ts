import { enableProdMode, ErrorHandler, importProvidersFrom, isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';

import { appConfig, WEBSOCKET_URL } from './app/utils/config';
import { version } from './version';
import { AppComponent } from './app/app.component';
import { ToastModule } from 'primeng/toast';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { LayoutModule } from '@angular/cdk/layout';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MenuModule } from 'primeng/menu';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LetDirective } from '@ngrx/component';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AlgErrorHandler } from './app/utils/error-handling/error-handler';
import { WithCredentialsInterceptor } from './app/interceptors/with_credentials.interceptor';
import { AuthenticationInterceptor } from './app/interceptors/authentication.interceptor';
import { TimeoutInterceptor } from './app/interceptors/timeout.interceptor';
import { HTTP_INTERCEPTORS, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { NgScrollbarOptions } from 'ngx-scrollbar/lib/ng-scrollbar.model';
import { NG_SCROLLBAR_OPTIONS, NgScrollbarModule } from 'ngx-scrollbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import routes from './app/app.routes';
import { provideRouter } from '@angular/router';
import { provideState, provideStore } from '@ngrx/store';
import { fromForum, forumEffects } from './app/forum/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { NavigationActionTiming, provideRouterStore } from '@ngrx/router-store';
import { fromObservation, observationEffects } from './app/store/observation';
import { fromRouter, RouterSerializer } from './app/store/router';
import { fromUserContent, groupStoreEffects } from './app/groups/store';
import { fromItemContent, itemStoreEffects } from './app/items/store';

const DEFAULT_SCROLLBAR_OPTIONS: NgScrollbarOptions = {
  visibility: 'hover',
};

Sentry.init({
  dsn: appConfig.sentryDsn,
  environment: appConfig.production ? `prod-${window.location.hostname}` : 'dev',
  release: version,
  integrations: [],
  ignoreErrors: [
    'Cannot redefine property: googletag',
    "Cannot read properties of undefined (reading 'sendMessage')", // a chrome extension error
    'Talisman extension',
    "can't access dead object", // a firefox error when add-ons keep references to DOM objects after their parent document was destroyed
  ],
  // from https://docs.sentry.io/clients/javascript/tips/
  denyUrls: [
    // Google Adsense
    /pagead\/js/i,
    // Facebook flakiness
    /graph\.facebook\.com/i,
    // Facebook blocked
    /connect\.facebook\.net\/en_US\/all\.js/i,
    // Woopra flakiness
    /eatdifferent\.com\.woopra-ns\.com/i,
    /static\.woopra\.com\/js\/woopra\.js/i,
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Other plugins
    /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
    /webappstoolbarba\.texthelp\.com\//i,
    /metrics\.itunes\.apple\.com\.edgesuite\.net\//i
  ],
});

if (appConfig.production) {
  enableProdMode();
}

/* eslint-disable no-console */ /* console call authorized here (?) */
bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      LetDirective,
      BreadcrumbModule,
      AccordionModule,
      NgScrollbarModule,
      TreeModule,
      TooltipModule,
      ConfirmDialogModule,
      DialogModule,
      DropdownModule,
      MenuModule,
      FormsModule,
      ConfirmPopupModule,
      OverlayPanelModule,
      LayoutModule,
      InputTextareaModule,
      ReactiveFormsModule,
      ToastModule
    ),
    ConfirmationService,
    MessageService,
    {
      provide: NG_SCROLLBAR_OPTIONS,
      useValue: DEFAULT_SCROLLBAR_OPTIONS,
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
      provide: WEBSOCKET_URL,
      useValue: appConfig.forumServerUrl
    },
    {
      provide: ErrorHandler,
      useClass: AlgErrorHandler,
    },
    provideRouter(routes),
    provideStore(),
    provideRouterStore({ serializer: RouterSerializer, navigationActionTiming: NavigationActionTiming.PostActivation }),
    provideState(fromRouter),
    provideState(fromObservation),
    provideState(fromForum),
    provideState(fromUserContent),
    provideState(fromItemContent),
    provideEffects(observationEffects, forumEffects(), groupStoreEffects(), itemStoreEffects()),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() , connectInZone: true }),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
  ]
}).catch(err => console.error(err));
