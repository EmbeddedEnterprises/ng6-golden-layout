import { InjectionToken, Type } from '@angular/core';
import * as GoldenLayout from 'golden-layout';

export interface ComponentType {
  /**
   * Optional string indicating that this component type is handled by the plugin
   * specified in this field.
   */
  plugin?: string;
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

export interface PluginDependencyType {
  /**
   * Fully qualified module name of the dependency
   */
  name: string;
  /**
   * Function that loads the dependency
   * Might return an object (direct load) OR a promise (deferred loading using import() syntax)
   */
  loader: any;
}

/**
 * Inject an array of ComponentType into this token to
 * register those by default with the ComponentRegistry
 */
export const GoldenLayoutComponents = new InjectionToken<ComponentType[]>('ComponentTypes');

/**
 * Inject dependency modules to be used with the PluginRegistry
 * This token can use multi: true
 */
export const GoldenLayoutPluginDependency = new InjectionToken<PluginDependencyType[]>('Dependencies');

export interface IExtendedGoldenLayoutConfig extends GoldenLayout.Config {
  settings: GoldenLayout.Config['settings'] & {
    /**
     * Use alternate maximise method that moves *all* tabs to the single root.
     */
    maximiseAllItems?: boolean;
  };
}

export interface IExtendedGoldenLayoutContainer extends GoldenLayout.Container {
  /**
   * Unique id for the container
   */
  id: string;
}
