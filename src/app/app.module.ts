import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Component, Injectable, OnInit, OnDestroy, Inject, ViewChild, HostListener } from '@angular/core';
import * as GoldenLayout from 'golden-layout';
import {
  GoldenLayoutModule,
  MultiWindowService,
  GlOnClose,
  FailedComponent,
  ComponentType,
  GoldenLayoutComponent,
  PluginRegistryService,
  RootWindowService,
  PluginDependencyType,
  GlOnPopout,
  GlOnShow,
  GlOnTab,
  GlOnHide,
  GlOnPopin,
  GlOnResize,
  GlOnUnload,
} from 'ngx-golden-layout';
import { BehaviorSubject } from 'rxjs';
import { GlHeaderItem } from 'projects/ngx-golden-layout/src/lib/hooks';

const CONFIG2: GoldenLayout.Config = {
  content: [{
    type: "component",
    componentName: "app-test",
    title: "First",
  }],
};

const CONFIG: GoldenLayout.Config = {
  content: [{
    type: "column",
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
      },
      {
        type: 'component',
        componentName: 'app-tested',
        title: 'Test 3',
      }
    ]
  }],
  settings: {
    maximiseAllItems: true,
  } as any,
};

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
  template: `<div></div>`,
  styles: [`:host { display: contents; } div { background-color: yellow; width: 100%; height: 100%; }`],
  selector: `app-header-test`,
})
export class HeaderTestComponent {

}

@Component({
  template: `<div class="spawn-new"></div><golden-layout-root #comp [layout]="layout$" (stateChanged)="stateChange()" (tabActivated)="tabActivated($event)"></golden-layout-root>`,
  selector: `app-root`,
})
export class RootComponent {
  public layout$ = new BehaviorSubject(CONFIG);
  @ViewChild(GoldenLayoutComponent, { static: true }) layout: GoldenLayoutComponent;
  constructor(
    private pluginRegistry: PluginRegistryService,
    private root: RootWindowService,
  ) {
  }

    ngAfterViewInit() {
    if (this.root.isChildWindow()) {
      return;
    }

    this.pluginRegistry.waitForPlugin('panel-library').then(() => {
      this.layout.createNewComponent({
        componentName: 'plugin-lib',
        type: 'component',
        title: 'Plugin - Dynamically loaded',
      });
    });
    setTimeout(() => {
      this.pluginRegistry.startLoadPlugin('panel-library', 'http://localhost:8000/panel-library.umd.min.js');
    }, 3000);
    setTimeout(() => {
      this.layout.createNewComponent({
          type: "component",
          componentName: "app-test",
          title: "First",
      })
    }, 5000);
    setTimeout(() => {
      this.layout.createNewComponent({
          type: "component",
          componentName: "app-test",
          title: "Second",
      })
    }, 10000);
  }
  stateChange() {
    console.log('State changed');
    //console.log('this.stateChange', this.layout.getSerializableState());
  }
  tabActivated(tab: any) {
    console.log('User activated tab:', tab);
  }
}
@Component({
  template: `<h1>Test</h1><span>{{test.id}}</span>`,
  selector: `app-test`,
})
export class TestComponent implements GlOnPopout, GlOnClose, GlOnHide, GlOnShow, GlOnPopin, GlOnResize, GlOnTab, GlOnUnload {
  glOnHide(): void {
    console.log('glOnHide');
  }
  constructor(public test: TestService) { }

  glOnPopout() {
    console.log('glOnPopout');
  }
  async glOnClose() {
    console.log('glOnClose')
  }
  glOnShow() {
    console.log('glOnShow');
  }
  glOnResize() {
    console.log('glOnResize');
  }
  glOnTab() {
    console.log('glOnTab');
  }
  glOnPopin() {
    console.log('glOnPopin');
  }
  glOnUnload() {
    console.log('glOnUnload');
  }
  ngOnInit() {
    console.log('Initialized');
  }
  ngOnDestroy() {
    console.log('Destroyed');
  }
}

@Component({
  template: `<h1>Test2</h1>`,
  selector: `app-tested`,
})
export class TestedComponent implements OnInit, OnDestroy, GlOnClose, GlHeaderItem {
  constructor() { }

  public ngOnInit(): void {
    (window.opener || window).console.log(`ngoninit`);
  }
  public ngOnDestroy(): void {
    (window.opener || window).console.log(`ngondestroy`);
  }

  public headerComponent = HeaderTestComponent;

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

const DEPS: PluginDependencyType[] = [{
  name: '@angular/core',
  loader: import('@angular/core'),
}, {
  name: '@angular/common',
  loader: import('@angular/common'),
}, {
  name: 'ngx-golden-layout',
  loader: import('ngx-golden-layout'),
}];

const COMPONENTS: ComponentType[] = [
  {
    name: 'app-test',
    type: TestComponent,
  },
  {
    name: 'app-tested',
    type: TestedComponent,
  }
];
@NgModule({
  declarations: [
    RootComponent,
    TestComponent,
    TestedComponent,
    FailComponent,
    HeaderTestComponent,
  ],
  entryComponents: [
    HeaderTestComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    GoldenLayoutModule.forRoot(COMPONENTS, FailComponent, DEPS),
  ],
  providers: [
    TestService,
    FooService,
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
