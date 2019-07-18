import { Injectable, Inject, Optional, Injector, NgModuleRef, ɵNgModuleFactory } from '@angular/core';
import { GoldenLayoutPluginDependency, PluginDependencyType } from './config';
import { Deferred } from './deferred';
import { Subject, Observable } from 'rxjs';
import { MultiWindowService } from './multiwindow-service';

interface IPluginState {
  id: string,
  url: string,
  module: Deferred<any>,
  moduleRef: NgModuleRef<any>,
  script: HTMLScriptElement,
};

interface IPluginURL {
  id: string,
  url: string,
};

/**
 * This class manages plugin load and unload requests across all windows.
 * Because we can't have progress reporting about all windows, we also don't
 * return any progress/success indicator here.
 */
@MultiWindowService<PluginURLProvider>()
@Injectable()
export class PluginURLProvider {
  private loadedURLs = new Map<string, string>();
  private loads = new Subject<IPluginURL>();
  private unloads = new Subject<string>();

  public loadRequests$(): Observable<IPluginURL> {
    return this.loads;
  }
  public unloadRequests$(): Observable<string> {
    return this.unloads;
  }
  public allPlugins(): IPluginURL[] {
    return [...this.loadedURLs.entries()].map(p => ({ id: p[0], url: p[1] }));
  }

  public requestLoad(id: string, url: string) {
    const p = this.loadedURLs.get(id);
    if (p) {
      if (p !== url) {
        throw new Error(`Plugin ${id} is already loaded with another URL`);
      }
      return;
    }
    this.loadedURLs.set(id, url);
    this.loads.next({ id, url });
  }

  public requestUnload(id: string) {
    const p = this.loadedURLs.get(id);
    if (!p) {
      throw new Error(`Plugin ${id} is not loaded`);
    }
    this.loadedURLs.delete(id);
    this.unloads.next(id);
  }
}

/**
 * This class automates the loading of bundles built with ng-packagr,
 * registering the components with GoldenLayout
 * This service MUST be instantiated once per window and defines the 'public'
 * API for loading and unloading plugins.
 */
@Injectable()
export class PluginRegistryService {
  private availableDependencies = new Map<string, Promise<any>>();
  private loadedPlugins = new Map<string, IPluginState>();

  public pluginLoaded$ = new Subject<{ id: string, module: NgModuleRef<any> }>();
  public pluginUnloaded$ = new Subject<string>();

  constructor(
    @Inject(GoldenLayoutPluginDependency) @Optional() deps: PluginDependencyType[] = [],
    private urlProvider: PluginURLProvider,
    private injector: Injector,
  ) {
    console.log('Creating PluginRegistry, got', deps.length, 'additional dependency modules');
    deps.forEach(x => this.availableDependencies.set(x.name, x.loader));

    this.patchWindow();

    this.urlProvider.loadRequests$().subscribe(p => this.load(p));
    // Load all previously loaded plugins
    this.urlProvider.allPlugins().forEach(p => this.load(p));
  }

  startLoadPlugin(id: string, url: string) {
    this.urlProvider.requestLoad(id, url);
  }
  startUnloadPlugin(id: string) {
    this.urlProvider.requestUnload(id);
  }

  waitForPlugin(id: string): Promise<any> {
    const p = this.loadedPlugins.get(id);
    if (p) {
      return p.module.promise;
    }

    const newPlugin: IPluginState = {
      id: id,
      module: new Deferred<any>(),
      url: null,
      script: null,
      moduleRef: null,
    };
    this.loadedPlugins.set(id, newPlugin);
    return newPlugin.module.promise;
  }

  private patchWindow() {
    (window as any).define = (moduleId: string, deps: string[], factory: (exports: any, ...deps: any[]) => void) => {
      const x = this.loadedPlugins.get(moduleId);
      if (!x) {
        console.warn('Unknown plugin called define():', moduleId);
        return;
      }

      // first param is exports
      deps = deps.slice(1);

      const depsExports = deps.map(d => {
        const p = this.availableDependencies.get(d);
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
        x.moduleRef = moduleFactory.create(this.injector);
        x.module.resolve(exports as any);
        this.pluginLoaded$.next({ id: x.id, module: x.moduleRef });
      }).catch(err => {
        console.warn('Failed to load plugin', moduleId, 'error', err);
        x.module.reject(err);
      });
    };
    (window as any).define.amd = true;
    console.log('Window AMD shim established.');
  }

  private load({ id, url }: IPluginURL) {
    let p = this.loadedPlugins.get(id);

    // plugin is already loaded or in progress.
    if (p && p.url) {
      if (p.url !== url) {
        throw new Error("Plugin is already loaded with another URL");
      }
      return;
    }

    // !p means that p is not acitvely being waited on, so create it.
    // if p is defined here it means that component construction actively
    // waits on the loading of this plugin, so we don't need to recreate
    // the structure here.
    if (!p) {
      p = {
        id: id,
        module: new Deferred<any>(),
        url: null,
        moduleRef: null,
        script: null,
      };
    }

    // Start the actual loading process
    p.url = url;
    this.loadedPlugins.set(id, p);

    const script = document.createElement('script');
    script.onerror = (e) => p.module.reject(e as any);
    script.type = 'text/javascript';
    script.src = url;
    p.script = script;

    document.body.appendChild(script);
  }

  private unload(id: string) {
    // TBD
  }
}
