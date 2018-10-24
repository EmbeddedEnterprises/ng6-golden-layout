export function MultiWindowInit(): void {
  if (!window.opener) {
    (window as any).__services = new (window as any).Map();
    (window as any).__serviceConstructors = new (window as any).Map();
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
    if (window === rootWindow) {
      const metadata = (Reflect as any).getMetadata('design:paramtypes', constr);
      (Reflect as any).metadata('design:paramtypes', metadata)(newConstructor);
    }
    return newConstructor as Constructor<T>;
  };
}
