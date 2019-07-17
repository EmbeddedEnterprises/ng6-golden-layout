import { Injectable, Inject, Optional, NgModuleFactory, Injector, NgModuleRef, getModuleFactory, ɵNgModuleFactory } from '@angular/core';
import { GoldenLayoutPluginDependency, PluginDependencyType } from './config';
import { Deferred } from './deferred';
import { Subject } from 'rxjs';

interface IPluginState {
  id: string,
  url: string,
  module: Deferred<any>,
  moduleRef: NgModuleRef<any>,
};

/**
 * This class automates the loading of bundles built with ng-packagr,
 * registering the components with GoldenLayout
 */
@Injectable()
export class PluginRegistryService {
  public pluginLoaded$ = new Subject<NgModuleRef<any>>();

  private availableModules = new Map<string, Promise<any>>();
  private plugins = new Map<string, IPluginState>();

  constructor(
    @Inject(GoldenLayoutPluginDependency) @Optional() deps: PluginDependencyType[] = [],
    injector: Injector,
  ) {
    console.log('Creating PluginRegistry, got', deps.length, 'additional dependency modules');
    deps.forEach(x => this.availableModules.set(x.name, x.loader));

    (window as any).define = (moduleId: string, deps: string[], factory: (exports: any, ...deps: any[]) => void) => {
      const x = this.plugins.get(moduleId);
      if (!x) {
        console.warn('Unknown plugin called define():', moduleId);
        return;
      }

      // first param is exports
      deps = deps.slice(1);

      const depsExports = deps.map(d => {
        const p = this.availableModules.get(d);
        if (!p) {
          console.warn('Plugin', moduleId, 'requested unknown dependency', d);
          return Promise.resolve(undefined);
        }
        return p.catch(err => {
          console.warn('Plugin', moduleId, 'dependency', d, 'but load failed', err);
          return undefined;
        });
      });
      Promise.all(depsExports).then(deps => {
        const exports: any = {};
        factory(exports, ...deps);
        console.log('Plugin', moduleId, 'loaded.');
        const moduleKlass = exports.MODULE;
        if (!moduleKlass) {
          return Promise.reject("No MODULE export found");
        }
        const moduleFactory = new ɵNgModuleFactory(moduleKlass);
        x.moduleRef = moduleFactory.create(injector);
        x.module.resolve(exports as any);
        this.pluginLoaded$.next(x.moduleRef);
      }).catch(err => {
        console.warn('Failed to load plugin', moduleId, 'error', err);
        x.module.reject(err);
      });
    };
    (window as any).define.amd = true;
    console.log('Window AMD shim established.');
  }

  async loadPlugin(id: string, url: string) {
    let p = this.plugins.get(id);
    if (p && p.url) {
      if (p.url !== url) {
        throw new Error("Plugin is already loaded with another URL");
      }
      return p.module;
    }
    if (!p) {
      p = {
        id: id,
        module: new Deferred<any>(),
        url: null,
        moduleRef: null,
      };
    }
    p.url = url;
    this.plugins.set(id, p);

    const script = document.createElement('script');
    script.onerror = (e) => p.module.reject(e as any);
    script.type = 'text/javascript';
    script.src = url;

    document.body.appendChild(script);
    return p.module.promise;
  }

  waitForPlugin(id: string): Promise<any> {
    const p = this.plugins.get(id);
    if (p) {
      return p.module.promise;
    }

    const newPlugin: IPluginState = {
      id: id,
      module: new Deferred<any>(),
      url: null,
      moduleRef: null,
    };
    this.plugins.set(id, newPlugin);
    return newPlugin.module.promise;
  }
}
