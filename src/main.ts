import { enableProdMode, ErrorHandler, importProvidersFrom, isDevMode } from '@angular/core';
import { AppComponent } from './app/app.component';
import { ToastModule } from 'primeng/toast';
import { LayoutModule } from '@angular/cdk/layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MessageService } from 'primeng/api';
import routes from './app/app.routes';
import { provideRouter } from '@angular/router';
import { provideState, provideStore } from '@ngrx/store';
import { fromForum, forumEffects } from './app/forum/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { NavigationActionTiming, provideRouterStore } from '@ngrx/router-store';
import { fromRouter, RouterSerializer } from './app/store/router';
import { fromGroupContent, groupStoreEffects } from './app/groups/store';
import { fromItemContent, itemStoreEffects } from './app/items/store';
import { fromSelectedContent, selectedContentEffects } from './app/store/navigation';
import { timeOffsetComputationInterceptor } from './app/interceptors/time_offset.interceptors';
import { fromTimeOffset } from './app/store/time-offset';
import { initErrorTracking } from './app/utils/error-handling/setup-error-tracking';
import { fromCurrentContent } from './app/store/navigation/current-content/current-content.store';
import { fromConfig, configEffects } from './app/store/config';
import { environment } from './environments/environment';
import { provideEnvironmentNgxMask } from 'ngx-mask';

const DEFAULT_SCROLLBAR_OPTIONS: NgScrollbarOptions = {
  visibility: 'hover',
};

initErrorTracking();

if (environment.production) {
  enableProdMode();
}

/* eslint-disable no-console */ /* console call authorized here (?) */
bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: ErrorHandler,
      useClass: AlgErrorHandler,
    },
    importProvidersFrom(
      BrowserModule,
      LetDirective,
      NgScrollbarModule,
      FormsModule,
      LayoutModule,
      ReactiveFormsModule,
      ToastModule
    ),
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
    provideRouter(routes),
    provideStore(),
    provideRouterStore({ serializer: RouterSerializer, navigationActionTiming: NavigationActionTiming.PostActivation }),
    provideState(fromRouter),
    provideState(fromForum),
    provideState(fromGroupContent),
    provideState(fromItemContent),
    provideState(fromTimeOffset),
    provideState(fromSelectedContent),
    provideState(fromCurrentContent),
    provideState(fromConfig),
    provideEffects(
      forumEffects(),
      groupStoreEffects(),
      itemStoreEffects(),
      selectedContentEffects,
      configEffects,
    ),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() , connectInZone: true }),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([ timeOffsetComputationInterceptor ])),
    provideEnvironmentNgxMask(),
  ]
}).catch(err => console.error(err));
