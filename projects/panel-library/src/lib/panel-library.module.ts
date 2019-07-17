import { NgModule, ANALYZE_FOR_ENTRY_COMPONENTS } from '@angular/core';
import { PanelLibraryComponent } from './panel-library.component';
import { ComponentRegistryService } from 'ngx-golden-layout';

const decls = [PanelLibraryComponent];
@NgModule({
  declarations: decls,
  providers: [{ provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: decls, multi: true }],
  exports: [PanelLibraryComponent],
  id: 'panel-library',
})
export class PanelLibraryModule {
  constructor(compReg: ComponentRegistryService) {
    compReg.registerComponent({
      name: 'plugin-lib',
      type: PanelLibraryComponent,
    });
    console.log('registered component');
  }
}
