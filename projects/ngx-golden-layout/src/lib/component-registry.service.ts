import { Inject, Injectable, Optional, Type } from '@angular/core';
import { ComponentType, DefaultComponents } from './config';

@Injectable()
export class ComponentRegistryService {
  private components = new Map<string, Type<any>>();

  constructor(@Inject(DefaultComponents) @Optional() initialComponents: ComponentType[]) {
    (initialComponents || []).forEach(c => this.registerComponent(c));
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
  }
}
