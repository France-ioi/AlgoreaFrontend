import { BrowserModule } from "@angular/platform-browser";
import { NgModule, ModuleWithProviders } from "@angular/core";

import { AccordionModule } from "primeng/accordion";

import { PerfectScrollbarModule } from "ngx-perfect-scrollbar";
import { PERFECT_SCROLLBAR_CONFIG } from "ngx-perfect-scrollbar";
import { PerfectScrollbarConfigInterface } from "ngx-perfect-scrollbar";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { LeftNavComponent } from "./left-nav/left-nav.component";
import { NavigationTabsComponent } from "./left-nav/navigation-tabs/navigation-tabs.component";
import { TopNavComponent } from "./top-nav/top-nav.component";
import { CoreModule } from "core";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";

import { TokenInterceptor } from "./shared/services/api/token.interceptor";
import {
  TimeoutInterceptor,
  DEFAULT_TIMEOUT,
} from "./shared/services/api/timeout.interceptor";

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
};

const providers = [];

@NgModule({
  declarations: [
    AppComponent,
    LeftNavComponent,
    NavigationTabsComponent,
    TopNavComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    HttpClientModule,
    AccordionModule,
    PerfectScrollbarModule,
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
      useValue: 3000
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

@NgModule({})
export class DevAppModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AppModule,
      providers: providers,
    };
  }
}
