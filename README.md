# ngx-golden-layout

[![Downloads](https://img.shields.io/npm/dm/ngx-golden-layout.svg)](https://www.npmjs.com/package/ngx-golden-layout) [![NPM Version](https://img.shields.io/npm/v/ngx-golden-layout.svg)](https://www.npmjs.com/package/ngx-golden-layout)
[![NPM Size](https://img.shields.io/bundlephobia/min/ngx-golden-layout.svg)](https://www.npmjs.com/package/ngx-golden-layout) [![Liberapay](https://img.shields.io/liberapay/receives/embeddedenterprises.svg?logo=liberapay)](https://liberapay.com/EmbeddedEnterprises/donate)

This project aims to provide a complete solution for embedding golden-layout within an angular 6+ application.

- This package got a major rewrite for Angular 8+, in order to be able to use the official angular library tooling.
- This document describes the Angular 8+ API, for the angular 6-7 API, please have a look at the ng6/ng7 branches.
- To prevent confusion, the package also got renamed:
  - For Angular 6/7 use `@embedded-enterprises/ng6-golden-layout@0.0.12`
  - For Angular 8 and a drop-in compatible API (easier upgrade) use `ngx-golden-layout@0.0.12`
  - To use the new API, use `ngx-golden-layout@0.0.17`

Thanks to the awesome people at https://www.browserstack.com which make testing for IE/Edge possible!

## Complete example

For a complete example, head over to the https://github.com/EmbeddedEnterprises/ngx-golden-layout-electron repo.

## Detailed Usage

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
    GoldenLayoutModule.forRoot(componentTypes),
  ],
  declarations: [
    // Add your panel components here
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

```css
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


```ts
import * as GoldenLayout from 'golden-layout';
import { Component, Inject } from '@angular/core';
import { 
  GoldenLayoutContainer,
  GoldenLayoutComponentHost,
  GoldenLayoutComponent,
} from '@embedded-enterprises/ng6-golden-layout';

@Component({})
export class TestComponent {

  constructor(
    @Inject(GoldenLayoutComponentHost) private goldenLayout: GoldenLayoutComponent,
    @Inject(GoldenLayoutContainer) private container: GoldenLayout.Container
  ) {
    this.goldenLayout.getGoldenLayout().selectItem(yourItem);
  }
}
```

These objects can then be used to manipulate the GoldenLayout.
**Important**: You must not cache the returned golden layout instance, as it might change as you pop out/in.

### Component Lifecycle

To get a deeper understanding on how to hook into golden layout and angulars behavior, refer to [LIFECYCLE.md](LIFECYCLE.md)

### Usage with angular routing

When you use angular routing, angular will manipulate the URLs on the client side and therefore destroy navigation for your application when you're opening a popout. The solution is fairly simple: we disable the angular routing functionality for child windows.

Let's assume your project looks like the following:

```bash
root
|->src
| |-> main.ts
| |-> index.html
| |-> app
| | |-> app.module.ts
| | |-> login.component.ts
| | |-> main.component.ts
| | x
| x
|-> angular.json
x
```

Basically we need to implement three things:
- Remove the static component initialization
- Add a second entry-NgModule to your app, where routing is disabled
- Select the routing-disabled NgModule when we're detecting that we're in a child window.

To proceed, we need the following information:
- The selector for your main component, where you bootstrap your app (lets call it `<app-main>`)
- The selector for your component where you initialize the golden-layout instance (lets call it `<app-docking>`)

#### Required Steps

1. Open up your index.html, remove the selector of the main component (`<app-main>`)
2. Open up your main.ts, find the lines where angular is bootstrapped (usually at the end of the file), remove them.
3. Add the following code, replace the selectors with your selectors.

```ts
if (!window.opener) {
  const baseRootElem = document.createElement('app-main');
  const script = document.body.querySelector('script');
  document.body.insertBefore(baseRootElem, script);
  platformBrowserDynamic().bootstrapModule(AppModule);
} else {
  const baseAppElem = document.createElement('app-docking');
  const script = document.body.querySelector('script');
  document.body.insertBefore(baseAppElem, script);
  platformBrowserDynamic().bootstrapModule(AppChildWindowModule);
}
```

4. Open up your app/app.module.ts.
  - Depending on your application, you usually have an AppModule where all your components are added and your `<app-main>` component is set as bootstrap.
  - Create a second module, call it AppChildWindowModule, add your components, import required modules (**without the router module**) and set the `<app-docking>` component as bootstrap.
  - For larger applications, you should organize your code into smaller NgModules which provide better scalability, since you don't need to add all declarations twice
  - At the end you should have something like the following:

```ts
const COMPONENTS = [
  AppDockingComponent,
  // Your dockable components,
];

@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS,
  imports: [CommonModule, GoldenLayoutModule.forRoot(CONFIG), /* Additional modules */],
})
export class AppComponentsModule {}

@NgModule({
  imports: [RouterModule.forRoot(ROUTES), AppComponentsModule],
  declarations: [AppMainComponent],
  entryComponents: [AppMainComponent],
  providers: [
    // Your providers
  ],
  bootstrap: [AppMainComponent],
})
export class AppModule { }

@NgModule({
  imports: [AppComponentsModule],
  providers: [
    // Your providers
  ],
  bootstrap: [AppDockingComponent], // Use your docking component here.
})
export class AppChildWindowModule { }
```

5. Fixing the production build, two more changes are neccessary:
  - set `useHash: true` in your call to `RouterModule.forRoot(ROUTES, { useHash: true })`
  - if you don't set this, your index.html won't be found in production builds.
  - add the following lines to your angular.json under `projects -> $NAME -> architect -> build -> configurations -> production -> fileReplacements`:
  ```json
  {
    "replace": "src/main.ts",
    "with": "src/main.prod",
  }
  ```
  - copy your `src/main.ts` into `src/main.prod` (**Don't** name `main.prod` `main.prod.ts` otherwise you will get build errors!)
  - edit the main.prod, do some search and replace:
    - replace `platformBrowserDynamic` by `platformBrowser`
    - replace `platform-browser-dynamic` by `platform-browser`
    - replace `bootstrapModule` by `bootstrapModuleFactory`
    - replace `AppModule` by `AppModuleNgFactory`
    - replace `AppChildWindowModule` by `AppChildWindowModuleNgFactory`
    - replace `app.module` by `app.module.ngfactory`
  - Run a production build
  - Should work now.


The effect of the changes done above is that we skip routing based on whether we're in a child window (no routing) or in the main window. When the route changes and the golden layout main-window component is destroyed, all child windows are disposed automatically.

To see a full-featured example including routing, have a look [here](https://github.com/EmbeddedEnterprises/ngx-golden-layout-electron).


### Synchronizing your services across multiple browser windows

All services used within your app can be chosen to be either scoped to the current window (default) or to be the same instance across all windows (like a singleton).

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

After that, you pass the Component Type into the GoldenLayout.forRoot function like this:

```ts
// In your main NgModule
@NgModule({
  imports: [
    GoldenLayoutModule.forRoot(COMPONENTS, InvalidComponent),
  ],
  declarations: [
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
- ~~Provide possibility to spawn and register new Panes on the fly~~
- Improve redocking algorithm

## Hacking

1. Fork the repository
2. Create a feature/bugfix branch
3. If you want to work on the binding, use `build.sh` or `npm run build` to create the npm package and link it into the example project.
4. If you want to work on the example project, just use ng serve to have the dev-server.
5. If you are happy, make a PR.

Contributions are welcome!
