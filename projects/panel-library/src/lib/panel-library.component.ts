import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-panel-library',
  template: `
    <p>
      Hello from the dynamically loaded plugin!
    </p>
  `,
  styles: []
})
export class PanelLibraryComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
