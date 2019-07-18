import { Inject, Injectable, Optional, Type } from '@angular/core';
import { ComponentType, GoldenLayoutComponents } from './config';
import { PluginRegistryService } from './plugin-registry.service';
import { Deferred } from './deferred';

@Injectable()
export class ComponentRegistryService {
  private components = new Map<string, Type<any>>();
  private awaitedComponents = new Map<string, Deferred<Type<any>>>();

  constructor(
    @Inject(GoldenLayoutComponents) @Optional() initialComponents: ComponentType[],
    private pluginRegistry: PluginRegistryService,
  ) {
    (initialComponents || []).forEach(c => this.registerComponent(c));

    this.pluginRegistry.pluginLoaded$.subscribe(({ id, module }) => {
      const registeredTokens = module.injector.get(GoldenLayoutComponents, []);
      console.log('Plugin', id, 'wants to register', registeredTokens.length, 'components');
      registeredTokens.forEach(c => this.registerComponent({ ...c, plugin: id }));
    });
  }

  public registeredComponents(): ComponentType[] {
    return [...this.components.entries()].map((e): ComponentType => ({ name: e[0], type: e[1] }));
  }

  // This is only for use by the GoldenLayoutComponent
  public componentMap(): Map<string, Type<any>> {
      return this.components;
  }

  public registerComponent(component: ComponentType) {
    const otherComponent = this.components.get(component.name);
    if (!!otherComponent && otherComponent !== component.type) {
      const err = new Error(`Failed to register component, ${component.name} is already taken by another component: ${otherComponent}`);
      throw err;
    }
    this.components.set(component.name, component.type);
    const d = this.awaitedComponents.get(component.name);
    if (d) {
      this.awaitedComponents.delete(component.name);
      d.resolve(component.type);
    }
  }

  public waitForComponent(component: string): Promise<Type<any>> {
    const c = this.components.get(component);
    if (c) {
      return Promise.resolve(c);
    }

    let d = this.awaitedComponents.get(component);
    if (!d) {
      d = new Deferred<Type<any>>();
      this.awaitedComponents.set(component, d);
    }
    return d.promise;
  }
}
