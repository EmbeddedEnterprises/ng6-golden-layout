import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Component, Injectable } from '@angular/core';
import * as $ from 'jquery';
import {
  GoldenLayoutModule,
  GoldenLayoutService,
  GoldenLayoutConfiguration,
  MultiWindowService,
} from '@embedded-enterprises/ng6-golden-layout';

@MultiWindowService<TestService>()
@Injectable()
export class TestService {
  public id: string;
  constructor() {
    this.id = '_' + Math.random().toString(36).substr(2, 9);
    console.log(`Creating testService, id: ${this.id}`);
  }
}

@Component({
  template: `<div class="spawn-new"></div><golden-layout-root></golden-layout-root>`,
  selector: `app-root`,
})
export class RootComponent {
  // test delayed component construction
  constructor(private srv: GoldenLayoutService) {
    setTimeout(() => {
      srv.createNewComponent(srv.getRegisteredComponents()[1]);
    }, 1000);
  }

}
@Component({
  template: `<h1>Test</h1><span>{{test.id}}</span>`,
  selector: `app-test`,
})
export class TestComponent {
  constructor(public test: TestService) { }

}
@Component({
  template: `<h1>Test2</h1>`,
  selector: `app-tested`,
})
export class TestedComponent {
  constructor() { }

}

const config: GoldenLayoutConfiguration = {
  components: [
    {
      component: TestComponent,
      componentName: 'app-test'
    },
    {
      component: TestedComponent,
      componentName: 'app-tested',
    },
  ],
  defaultLayout: {
    content: [
      {
        type: "row",
        content: [
          {
            type: 'component',
            componentName: 'app-test',
            title: 'Test 1',
          },
          {
            type: 'component',
            componentName: 'app-test',
            title: 'Test 2',
          }
        ]
      }
    ]
  }
}

@NgModule({
  declarations: [RootComponent, TestComponent, TestedComponent],
  entryComponents: [TestComponent, TestedComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    GoldenLayoutModule.forRoot(config),
  ],
  providers: [TestService],
  bootstrap: [RootComponent]
})
export class AppModule { }
