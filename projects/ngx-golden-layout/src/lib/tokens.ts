import { InjectionToken } from '@angular/core';
import * as GoldenLayout from 'golden-layout';
export const GoldenLayoutContainer = new InjectionToken('GoldenLayoutContainer');
export const GoldenLayoutComponentState = new InjectionToken('GoldenLayoutComponentState');
export const GoldenLayoutEventHub = new InjectionToken('GoldenLayoutEventHub');
export const GoldenLayoutComponentHost = new InjectionToken('GoldenLayoutComponentHost');
export interface IExtendedGoldenLayoutConfig extends GoldenLayout.Config {
  settings: GoldenLayout.Config["settings"] & {
    maximiseAllItems: boolean,
  };
};
