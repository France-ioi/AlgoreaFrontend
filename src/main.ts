import { enableProdMode, ErrorHandler, importProvidersFrom, isDevMode } from '@angular/core';

import { appConfig, WEBSOCKET_URL } from './app/utils/config';
import { AppComponent } from './app/app.component';
import { ToastModule } from 'primeng/toast';
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
import { HTTP_INTERCEPTORS, withInterceptorsFromDi, provideHttpClient, withInterceptors } from '@angular/common/http';
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
import { fromGroupContent, groupStoreEffects } from './app/groups/store';
import { fromItemContent, itemStoreEffects } from './app/items/store';
import { fromSelectedContent, selectedContentEffects } from './app/store/navigation';
import { timeOffsetComputationInterceptor } from './app/interceptors/time_offset.interceptors';
import { fromTimeOffset } from './app/store/time-offset';
import { initErrorTracking } from './app/utils/error-handling/setup-error-tracking';
import { fromCurrentContent } from './app/store/navigation/current-content/current-content.store';
import { appInitEffects } from './app/store/app-init';
import { fromAppInit } from './app/store/app-init/app-init.store';

const DEFAULT_SCROLLBAR_OPTIONS: NgScrollbarOptions = {
  visibility: 'hover',
};

initErrorTracking();

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
    provideState(fromGroupContent),
    provideState(fromItemContent),
    provideState(fromTimeOffset),
    provideState(fromSelectedContent),
    provideState(fromCurrentContent),
    provideState(fromAppInit),
    provideEffects(
      forumEffects(),
      observationEffects,
      groupStoreEffects(),
      itemStoreEffects(),
      selectedContentEffects,
      appInitEffects,
    ),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() , connectInZone: true }),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([ timeOffsetComputationInterceptor ])),
  ]
}).catch(err => console.error(err));
