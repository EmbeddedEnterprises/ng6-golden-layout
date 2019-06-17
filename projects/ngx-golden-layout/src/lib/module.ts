import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoldenLayoutComponent } from './golden-layout.component';
import { RootWindowService } from './root-window.service';
import { ComponentType, DefaultComponents } from './config';
import { ComponentRegistryService } from './component-registry.service';

@NgModule({
  declarations: [GoldenLayoutComponent],
  exports: [GoldenLayoutComponent],
  imports: [CommonModule]
})
export class GoldenLayoutModule {
  public static forRoot(types?: ComponentType[]): ModuleWithProviders {
    return {
      ngModule: GoldenLayoutModule,
      providers: [
        ComponentRegistryService,
        RootWindowService,
        { provide: DefaultComponents, useValue: types }
      ]
    };
  }
}
