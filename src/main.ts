import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/core/app.module';
import { appConfig } from './app/shared/helpers/config';

if (appConfig.production) {
  enableProdMode();
}

/* eslint-disable no-console */ /* console call authorized here (?) */
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
