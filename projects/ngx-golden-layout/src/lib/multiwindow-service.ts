export function MultiWindowInit(): void {
  console.log('MultiWindowInit');
  if (!window.opener) {
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

export type Constructor<T> = {
  new (...args: any[]): T;
}

export function MultiWindowService<T>() {
  return function (constructor: Constructor<T>): Constructor<T> {
    const constr = constructor as any;
    const rootWindow = (window.opener || window) as any;
    const newConstructor = (function(...args: any[]): T {
      const hasInstance = rootWindow.__services.has(constr.name);
      if (!hasInstance) {
        const storedConstr = rootWindow.__serviceConstructors.get(constr.name) || constr;
        rootWindow.__services.set(constr.name, new storedConstr(...args));
      }
      return rootWindow.__services.get(constr.name);
    }) as any;
    try {
      if (window === rootWindow) {
        const metadata = (Reflect as any).getMetadata('design:paramtypes', constr);
        (Reflect as any).metadata('design:paramtypes', metadata)(newConstructor);
      }
    } catch {
      // obviously, we're in ivy.
    }
    return newConstructor as Constructor<T>;
  };
}
