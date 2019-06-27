# ngx-golden-layout

[![Downloads](https://img.shields.io/npm/dm/ngx-golden-layout.svg)](https://www.npmjs.com/package/ngx-golden-layout) [![NPM Version](https://img.shields.io/npm/v/ngx-golden-layout.svg)](https://www.npmjs.com/package/ngx-golden-layout)
[![NPM Size](https://img.shields.io/bundlephobia/min/ngx-golden-layout.svg)](https://www.npmjs.com/package/ngx-golden-layout) [![Liberapay](https://img.shields.io/liberapay/receives/embeddedenterprises.svg?logo=liberapay)](https://liberapay.com/EmbeddedEnterprises/donate)

This project aims to provide a complete solution for embedding golden-layout within an angular 6+ application.

This package got a major rewrite for Angular 8+, in order to be able to use the official angular library tooling.
This document describes the Angular 8+ API, for the angular 6-7 API, please have a look at the ng6/ng7 branches.
To prevent confusion, the package also got renamed:
- For Angular 6/7 use `@embedded-enterprises/ng6-golden-layout@0.0.12`
- For Angular 8 and a drop-in compatible API (easier upgrade) use `ngx-golden-layout@0.0.12`
- To use the new API, use `ngx-golden-layout@0.0.13`

Thanks to the awesome people at https://www.browserstack.com which make testing for IE/Edge possible!

## Usage

### Complete example

For a complete example, head over to the https://github.com/EmbeddedEnterprises/ngx-golden-layout-electron repo.

Install via npm:

```sh
$ npm install --save ngx-golden-layout
```

A manual install of package dependencies will be necessary, too

```sh
$ npm install --save golden-layout@1.5.7 jquery
$ npm install --save-dev @types/jquery
```

Importing and configuration:
```ts
import { GoldenLayoutModule } from '@embedded-enterprises/ng6-golden-layout';
import * as $ from 'jquery';

// It is required to have JQuery as global in the window object.
window['$'] = $;

// Define all component types known at compile time to the golden-layout binding.
// It's possible to modify these at runtime using the `ComponentRegistryService`
const componentTypes: ComponentType[] = [{
  name: 'name',
  type: MyFancyAngularComponent,
}];

@NgModule({
  imports: [
    //...
    GoldenLayoutModule.forRoot(config),
  ],
  declarations: [
    // Add your panel components here
    MyFancyAngularComponent,
  ],
  entryComponents: [
    // Also add your panel components here.
    MyFancyAngularComponent,
  ],
})
export class AppModule {}
```

In the `@NgModule` decorator, under `entryComponents` list all the components that should be rendered within golden layout.

To pass a layout into the golden-layout component, create an `Observable<GoldenLayout.Config>` and pass your layout/root config in. 
Example code could look like this:

```ts
import { of } from 'rxjs';

const INITIAL_LAYOUT = GoldenLayout.Config = {
  content: [{
    type: 'row',
    content: [{
      type: 'component',
      componentName: 'name', // The name defined in componentTypes
      title: 'CustomTitle',
    }, {
      type: 'component',
      componentName: 'name', // The name defined in componentTypes
      title: 'Another Name',
    }]
  }]
};

@Component({
  template: `<div class="spawn-new"></div><golden-layout-root [layout]="layoutConfig$"></golden-layout-root>`,
  selector: `app-root`,
})
export class RootComponent {
  layoutConfig$ = of(INITIAL_LAYOUT);
}
```

Finally import GoldenLayout styles into `styles.css`

```
@import "~golden-layout/src/css/goldenlayout-base.css";
@import "~golden-layout/src/css/goldenlayout-light-theme.css";

body, html {
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
}
```

After that it should work right away out of the box.

### Accessing the underlying GoldenLayout API

The original GoldenLayout API may be obtained through the Angular dependency injection mechanism in any of the components rendered with GoldenLayout.


```
import * as GoldenLayout from 'golden-layout';
import { Component, Inject } from '@angular/core';
import { GoldenLayoutContainer } from '@embedded-enterprises/ng6-golden-layout';

@Component({})
export class TestComponent {

  constructor(
    private goldenLayout: GoldenLayout,
    @Inject(GoldenLayoutContainer) private container: GoldenLayout.Container
  ) { }
}
```

These objects can then be used to manipulate the GoldenLayout.

### Usage with angular routing

- To be documented.

### Synchronizing your services across multiple browser windows

All services used within your app can be chosen to be either scoped to the current window (default) or to be the same instance across all windows (like a singleton).

To use services across multiple windows, you need to initialize the multi-window compatibility layer.

```ts
// in main.ts
import { MultiWindowInit } from '@embedded-enterprises/ng6-golden-layout';

// call MultiWindowInit before bootstrapModule().
MultiWindowInit();
```

To synchronize a service, use the `@MultiWindowService()` decorator:

```ts
@MultiWindowService<YourService>()
@Injectable()
class YourService {
  // implementation
}
```

**NOTE:** This only works once per service instance, it will destroy scoped services!

### Provide a fallback for invalid component configurations

If you want to remove a component type, but don't want your users to clear the entire state, you can use the fallback
component.

It works by creating a component, like this:

```ts
import { FailedComponent } from '@embedded-enterprises/ng6-golden-layout';
@Component({
  selector: `app-invalid`,
  template: `<h1>Component {{componentName}} couldn't be found`,
})
class InvalidComponent {
  // The InjectionToken `FailedComponent` provides the name of the failed component.
  // You can use this to implement arbitrarily complex error pages.
  constructor(@Inject(FailedComponent) public componentName: string) { }
}
```

After that, you inject the previously created component into the GoldenLayout binding like this:

```ts
// In your main NgModule
import { FallbackComponent } from '@embedded-enterprises/ng6-golden-layout';
@NgModule({
  providers: [
    //...
    {
      provide: FallbackComponent,
      useValue: InvalidComponent, // DON'T USE `useClass` or `useFactory` here!
    },
  ],
  declarations: [
    //...
    InvalidComponent,
  ],
  entryComponents: [
    //...
    InvalidComponent,
  ],
})
export class MyModule { }
```

When you have setup this, the binding will automatically create this component whenever a panel type couldn't be found.

## Current state

This binding is stable but by far not feature complete.

## Roadmap

- ~~Automatic service Injection~~
- ~~Make Configuration more robust (it currently fails if it can't find a pane)~~
- Provide possibility to spawn and register new Panes on the fly
- Improve redocking algorithm

## Hacking

1. Fork the repository
2. Create a feature/bugfix branch
3. If you want to work on the binding, use `build.sh` or `npm run build` to create the npm package and link it into the example project.
4. If you want to work on the example project, just use ng serve to have the dev-server.
5. If you are happy, make a PR.

Contributions are welcome!
