import { NgModule, ModuleWithProviders, ANALYZE_FOR_ENTRY_COMPONENTS, Type, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoldenLayoutComponent } from './golden-layout.component';
import { RootWindowService } from './root-window.service';
import * as config from './config';
import { ComponentRegistryService } from './component-registry.service';
import { FallbackComponent } from './fallback';
import { PluginRegistryService, MockPluginRegistryService } from './plugin-registry.service';
import { WindowSynchronizerService, MockWindowSynchronizerService } from './window-sync.service';
import { PluginURLProvider } from './plugin-url.service';
import { WrapperComponent } from './wrapper.component';

@NgModule({
  declarations: [GoldenLayoutComponent, WrapperComponent],
  exports: [GoldenLayoutComponent],
  imports: [CommonModule]
})
export class GoldenLayoutModule {
  public static forRoot(types: config.ComponentType[], fallback?: Type<any>, pluginDeps?: config.PluginDependencyType[]): ModuleWithProviders<GoldenLayoutModule> {
    return {
      ngModule: GoldenLayoutModule,
      providers: [
        ComponentRegistryService,
        RootWindowService,
        PluginRegistryService,
        PluginURLProvider,
        WindowSynchronizerService,
        { provide: config.GoldenLayoutComponents, useValue: types, },
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: [types, fallback, WrapperComponent], multi: true },
        { provide: config.GoldenLayoutPluginDependency, useValue: pluginDeps },
        { provide: FallbackComponent, useValue: fallback },
      ],
    };
  }

  public static forChild(types: config.ComponentType[], fallback?: Type<any>): Provider[] {
    return [
      ComponentRegistryService,
      { provide: PluginRegistryService, useClass: MockPluginRegistryService },
      { provide: WindowSynchronizerService, useClass: MockWindowSynchronizerService },
      { provide: PluginURLProvider, useValue: null },
      { provide: config.GoldenLayoutComponents, useValue: types, },
      { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: [types, fallback, WrapperComponent], multi: true },
      { provide: FallbackComponent, useValue: fallback },
    ];
  }
}

