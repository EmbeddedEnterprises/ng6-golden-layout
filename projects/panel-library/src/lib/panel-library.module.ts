import { NgModule } from '@angular/core';
import { PanelLibraryComponent } from './panel-library.component';
import { forChild } from 'ngx-golden-layout';

const TYPES = [{
  name: 'plugin-lib',
  type: PanelLibraryComponent,
}];

@NgModule({
  declarations: [PanelLibraryComponent],
  providers: [...forChild(TYPES)],
  exports: [PanelLibraryComponent],
  id: 'panel-library',
})
export class PanelLibraryModule { }
