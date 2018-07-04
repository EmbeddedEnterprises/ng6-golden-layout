import { NgModule, ModuleWithProviders, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoldenLayoutConfiguration } from './config';
import { GoldenLayoutService } from './golden-layout.service';
import { GoldenLayoutComponent } from './golden-layout.component';

@NgModule({
  declarations: [GoldenLayoutComponent],
  exports: [GoldenLayoutComponent],
  imports: [CommonModule]
})
export class GoldenLayoutModule {
  public static forRoot(config: GoldenLayoutConfiguration): ModuleWithProviders {
    return {
      ngModule: GoldenLayoutModule,
      providers: [
        GoldenLayoutService,
        { provide: GoldenLayoutConfiguration, useValue: config }
      ]
    };
  }
}
