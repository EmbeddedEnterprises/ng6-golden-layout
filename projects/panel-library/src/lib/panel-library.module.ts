import { NgModule } from '@angular/core';
import { PanelLibraryComponent } from './panel-library.component';
import { GoldenLayoutModule } from 'ngx-golden-layout';

const TYPES = [{
  name: 'plugin-lib',
  type: PanelLibraryComponent,
}];

@NgModule({
  declarations: [PanelLibraryComponent],
  providers: [...GoldenLayoutModule.forChild(TYPES)],
  exports: [PanelLibraryComponent],
  id: 'panel-library',
})
export class PanelLibraryModule { }
