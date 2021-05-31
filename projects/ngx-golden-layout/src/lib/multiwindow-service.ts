export function MultiWindowInit(): void {
  if (!isChildWindow()) {
    if (!(window as any).__services && !(window as any).__serviceConstructors) {
      (window as any).__services = new (window as any).Map();
      (window as any).__serviceConstructors = new (window as any).Map();

      // Electron compatibility, when we have a global 'require' in our window, we throw it into the new window context
      if ((window as any).require) {
        const originalWindowOpen = window.open.bind(window);
        window.open = (url?: string, target?: string, features?: string, replace?: boolean): Window => {
          const newWindow = originalWindowOpen(url, target, features, replace);
          newWindow.require = (window as any).require;
          return newWindow;
        };
      }
    }
  }
}

export type Constructor<T> = {
  new (...args: any[]): T;
}

export function isChildWindow(): boolean {
  try {
    return !!window.opener && !!window.opener.location.href;
  } catch (e) {
    return false;
  }
}

export function MultiWindowService<T>(uniqueName: string) {
  MultiWindowInit();
  return function (constructor: Constructor<T>): Constructor<T> {
    const constr = constructor as any;
    const rootWindow = (isChildWindow() ? window.opener : window) as any;
    const rootWindowIsMyWindow = rootWindow === window;
    if (rootWindowIsMyWindow) {
      const constrGot = rootWindow.__serviceConstructors.get(uniqueName);
      if (constrGot && constrGot !== constr) {
        throw new Error(`MultiWindowService(): uniqueName ${uniqueName} already taken by ${constrGot}, wanted by ${constr}`);
      }
      rootWindow.__serviceConstructors.set(uniqueName, constr);
    }
    const newConstructor = (function(...args: any[]): T {
      const hasInstance = rootWindow.__services.has(uniqueName);
      if (!hasInstance) {
        const storedConstr = rootWindow.__serviceConstructors.get(uniqueName) || constr;
        rootWindow.__services.set(uniqueName, new storedConstr(...args));
      }
      return rootWindow.__services.get(uniqueName);
    }) as any;
    if (rootWindowIsMyWindow) {
      // https://github.com/angular/angular/issues/36120
      // ɵfac is created before this decorator runs.
      // so copy over the static properties.
      for (const prop in constr) {
        if (constr.hasOwnProperty(prop)) {
          newConstructor[prop] = constr[prop];
        }
      }
    }
    try {
      if (rootWindowIsMyWindow) {
        const metadata = (Reflect as any).getMetadata('design:paramtypes', constr);
        (Reflect as any).metadata('design:paramtypes', metadata)(newConstructor);
      }
    } catch {
      // obviously, we're in ivy.
    }
    return newConstructor as Constructor<T>;
  };
}
