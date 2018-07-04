import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Component } from '@angular/core';
import * as $ from 'jquery';
import {
  GoldenLayoutModule,
  GoldenLayoutService,
  GoldenLayoutConfiguration
} from '@embedded-enterprises/ng6-golden-layout';

@Component({
  template: `<golden-layout-root></golden-layout-root>`,
  selector: `app-root`,
})
export class RootComponent {
  constructor() { }

}
@Component({
  template: `<h1>Test</h1>`,
  selector: `app-test`,
})
export class TestComponent {
  constructor() { }

}

const config: GoldenLayoutConfiguration = {
  components: [
    {
      component: TestComponent,
      componentName: 'app-test'
    }
  ],
  defaultLayout: {
    content: [
      {
        type: 'component',
        componentName: 'app-test',
        title: 'Test',
      }
    ]
  }
}

@NgModule({
  declarations: [RootComponent, TestComponent],
  entryComponents: [TestComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    GoldenLayoutModule.forRoot(config),
  ],
  providers: [],
  bootstrap: [RootComponent]
})
export class AppModule { }
