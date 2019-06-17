import { InjectionToken, Type } from '@angular/core';

export interface ComponentType {
  /**
   * Name used to register compoent with GoldenLayout.
   * Must be unique over all component types
   */
  name: string;

  /**
   * Angular component type.
   * Pass the class of the component to instantiate here.
   */
  type: Type<any>;
}

/**
 * Inject an array of ComponentType into this token to
 * register those by default with the ComponentRegistry
 */
export const DefaultComponents = new InjectionToken<ComponentType[]>('ComponentTypes');
