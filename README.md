# ng6-golden-layout

[![Downloads](https://img.shields.io/npm/dm/@embedded-enterprises/ng6-golden-layout.svg)](https://www.npmjs.com/package/@embedded-enterprises/ng6-golden-layout) [![NPM Version](https://img.shields.io/npm/v/@embedded-enterprises/ng6-golden-layout.svg)](https://www.npmjs.com/package/@embedded-enterprises/ng6-golden-layout)
[![NPM Size](https://img.shields.io/bundlephobia/min/@embedded-enterprises/ng6-golden-layout.svg)](https://www.npmjs.com/package/@embedded-enterprises/ng6-golden-layout) [![Liberapay](https://img.shields.io/liberapay/receives/embeddedenterprises.svg?logo=liberapay)](https://liberapay.com/EmbeddedEnterprises/donate)

This project aims to provide a complete solution for embedding golden-layout within an angular 6 application.

## Usage

Install via npm:

```sh
$ npm install --save @embedded-enterprises/ng6-golden-layout
```

Importing and configuration:
```ts
import { GoldenLayoutModule, GoldenLayoutConfiguration } from '@embedded-enterprises/ng6-golden-layout';
import * as $ from 'jquery';

// It is required to have JQuery as global in the window object.
window['$'] = $;

const config: GoldenLayoutConfiguration = { ... };

@NgModule({
  imports: [
    //...
    GoldenLayoutModule.forRoot(config),
  ],
  declarations: [
    // Add your components here
  ],
  entryComponents: [
    // Add your components which are used as panels in golden-layout also here.
  ],
})
export class AppModule {}
```

After that it should work right away out of the box.

## Current state

This binding is stable but by far not feature complete.

## Roadmap

- Automatic service Injection
- Make Configuration more robust (it currently fails if it can't find a pane)
- Provide possibility to spawn and register new Panes on the fly
- Improve redocking algorithm

## Hacking

1. Fork the repository
2. Create a feature/bugfix branch
3. If you want to work on the binding, use `build.sh` or `npm run build` to create the npm package and link it into the example project.
4. If you want to work on the example project, just use ng serve to have the dev-server.
5. If you are happy, make a PR.

Contributions are welcome!
