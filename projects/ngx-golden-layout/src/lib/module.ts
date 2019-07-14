import { NgModule, ModuleWithProviders, APP_INITIALIZER, ANALYZE_FOR_ENTRY_COMPONENTS, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoldenLayoutComponent } from './golden-layout.component';
import { RootWindowService } from './root-window.service';
import { ComponentType, DefaultComponents } from './config';
import { ComponentRegistryService } from './component-registry.service';
import { MultiWindowInit } from './multiwindow-service';
import { FallbackComponent } from './fallback';

@NgModule({
  declarations: [GoldenLayoutComponent],
  exports: [GoldenLayoutComponent],
  imports: [CommonModule]
})
export class GoldenLayoutModule {
  public static forRoot(types?: ComponentType[], fallback?: Type<any>): ModuleWithProviders {
    return {
      ngModule: GoldenLayoutModule,
      providers: [
        ComponentRegistryService,
        RootWindowService,
        { provide: DefaultComponents, useValue: types },
        { provide: APP_INITIALIZER, useValue: MultiWindowInit, multi: true },
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: [types, fallback], multi: true },
        { provide: FallbackComponent, useValue: fallback },
      ]
    };
  }
}
