import { enableProdMode, ErrorHandler, importProvidersFrom, isDevMode } from '@angular/core';
import { AppComponent } from './app/app.component';
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
import { NG_SCROLLBAR_OPTIONS, NgScrollbarModule, NgScrollbarOptions } from 'ngx-scrollbar';
import routes from './app/app.routes';
import { provideRouter } from '@angular/router';
import { provideState, provideStore } from '@ngrx/store';
import { fromForum } from './app/forum/store';
import { forumEffects } from './app/forum/store/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';
import { NavigationActionTiming, provideRouterStore } from '@ngrx/router-store';
import { fromRouter, RouterSerializer } from './app/store/router';
import { fromGroupContent } from './app/groups/store';
import { groupStoreEffects } from './app/groups/store/effects';
import { fromWebsocket } from './app/store/websocket';
import { websocketEffects } from './app/store/websocket/effects';
import { fromItemContent as fromItem } from './app/items/store';
import { itemStoreEffects } from './app/items/store/effects';
import { fromSelectedContent } from './app/store/navigation';
import { analyticsTrackingEffects, selectedContentEffects } from './app/store/navigation/effects';
import { timeOffsetComputationInterceptor } from './app/interceptors/time_offset.interceptors';
import { fromTimeOffset } from './app/store/time-offset';
import { fromNotification } from './app/store/notification';
import {
  notificationEffects, notificationWebsocketEffects, notificationThreadCleanupEffects
} from './app/store/notification/effects';
import { fromCommunity } from './app/community/store';
import { communityEffects, communityWsSubscriptionEffects } from './app/community/store/effects';
import { initErrorTracking } from './app/utils/error-handling/setup-error-tracking';
import { fromCurrentContent } from './app/store/navigation/current-content/current-content.store';
import { fromConfig } from './app/store/config';
import { configEffects } from './app/store/config/effects';
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
    ),
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
    provideState(fromWebsocket),
    provideState(fromForum),
    provideState(fromGroupContent),
    provideState(fromItem),
    provideState(fromTimeOffset),
    provideState(fromSelectedContent),
    provideState(fromCurrentContent),
    provideState(fromConfig),
    provideState(fromNotification),
    provideState(fromCommunity),
    provideEffects(
      websocketEffects,
      forumEffects(),
      groupStoreEffects(),
      itemStoreEffects(),
      selectedContentEffects,
      analyticsTrackingEffects,
      configEffects,
      notificationEffects,
      notificationWebsocketEffects,
      notificationThreadCleanupEffects,
      communityEffects,
      communityWsSubscriptionEffects,
    ),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() , connectInZone: true }),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([ timeOffsetComputationInterceptor ])),
    provideEnvironmentNgxMask(),
  ]
}).catch(err => console.error(err));
