import { NgModule, ModuleWithProviders, APP_INITIALIZER, ANALYZE_FOR_ENTRY_COMPONENTS, Type, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoldenLayoutComponent } from './golden-layout.component';
import { RootWindowService } from './root-window.service';
import * as config from './config';
import { ComponentRegistryService } from './component-registry.service';
import { MultiWindowInit } from './multiwindow-service';
import { FallbackComponent } from './fallback';
import { PluginRegistryService, PluginURLProvider } from './plugin-registry.service';

@NgModule({
  declarations: [GoldenLayoutComponent],
  exports: [GoldenLayoutComponent],
  imports: [CommonModule]
})
export class GoldenLayoutModule {
  public static forRoot(types: config.ComponentType[], fallback?: Type<any>, pluginDeps?: config.PluginDependencyType[]): ModuleWithProviders {
    return {
      ngModule: GoldenLayoutModule,
      providers: [
        ComponentRegistryService,
        RootWindowService,
        PluginRegistryService,
        PluginURLProvider,
        { provide: APP_INITIALIZER, useValue: MultiWindowInit, multi: true },
        { provide: config.GoldenLayoutComponents, useValue: types, },
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: [types, fallback], multi: true },
        { provide: config.GoldenLayoutPluginDependency, useValue: pluginDeps },
        { provide: FallbackComponent, useValue: fallback },
      ],
    };
  }
}

export function forChild(types: config.ComponentType[]): Provider[] {
  return [
    { provide: config.GoldenLayoutComponents, useValue: types },
    { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: types, multi: true },
  ];
}
