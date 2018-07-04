import { InjectionToken, Type } from '@angular/core';
import * as GoldenLayout from 'golden-layout';

export interface ComponentConfiguration {
  /**
   * Name used to register compoent with GoldenLayout.
   */
  componentName: string;

  /**
   * Angular component type.
   */
  component: Type<any>;
}

export interface GoldenLayoutConfiguration {
  /**
   * Array of component configurations.
   */
  components: ComponentConfiguration[];

  /**
   * Initial component layout configuration.
   */
  defaultLayout: GoldenLayout.Config;
}

export const GoldenLayoutConfiguration = new InjectionToken('GoldenLayoutConfiguration');
