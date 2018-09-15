import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { MultiWindowInit } from '@embedded-enterprises/ng6-golden-layout';
import * as $ from 'jquery';


if (environment.production) {
  enableProdMode();
}
MultiWindowInit();
window['$'] = $;
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
