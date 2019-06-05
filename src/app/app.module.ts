import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Component, Injectable, OnInit, OnDestroy, Inject } from '@angular/core';

import {
  GoldenLayoutModule,
  GoldenLayoutService,
  GoldenLayoutConfiguration,
  MultiWindowService,
  GlOnClose,
  FallbackComponent,
  FailedComponent,
} from 'ngx-golden-layout';

@MultiWindowService<FooService>()
@Injectable()
export class FooService {
  constructor() {
    console.log(`Create FooService`);
  }
}

@MultiWindowService<TestService>()
@Injectable()
export class TestService {
  public id: string;
  constructor(private _foo: FooService) {
    console.log(`FooService: `, _foo);
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
    if (!window.opener) {
      setTimeout(() => {
        srv.createNewComponent({
          componentName: 'app-tested',
          component: null,
        });
      }, 1000);
    }
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
export class TestedComponent implements OnInit, OnDestroy, GlOnClose {
  constructor() { }

  public ngOnInit(): void {
    (window.opener || window).console.log(`ngoninit`);
  }
  public ngOnDestroy(): void {
    (window.opener || window).console.log(`ngondestroy`);
  }

  public glOnClose(): Promise<void> {
    console.log(`glOnClose`);
    return new Promise((resolve, reject) => {
      console.log(`glonclose promise`);
      setTimeout(() => {
        console.log(`resolving`);
        resolve()
      }, 1000);
    });
  }
}

/* Provide a fallback for components which couldn't be found. */
@Component({
  template: `<h1>Failed to load {{componentName}}</h1>`,
  selector: `app-failed`,
})
export class FailComponent {
constructor(@Inject(FailedComponent) public componentName: string) { }
}

const config: GoldenLayoutConfiguration = {
  components: [
    {
      component: TestComponent,
      componentName: 'app-test'
    },
    {
      component: TestedComponent,
      componentName: 'app-tested'
    }
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
  declarations: [RootComponent, TestComponent, TestedComponent, FailComponent],
  entryComponents: [TestComponent, FailComponent, TestedComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    GoldenLayoutModule.forRoot(config),
  ],
  providers: [
    TestService,
    FooService,
    {
      provide: FallbackComponent,
      useValue: FailComponent,
    },
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
