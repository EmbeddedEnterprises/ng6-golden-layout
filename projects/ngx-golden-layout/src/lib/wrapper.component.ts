import { Component, ViewEncapsulation, Inject, Injectable } from '@angular/core';
import { GlHeaderItem } from './hooks';
import { GoldenLayoutComponentHost, GoldenLayoutComponentState } from './tokens';

@Component({
  selector: 'gl-wrapper',
  encapsulation: ViewEncapsulation.None,
  template: `<div class="wrapper"></div>`
})
export class WrapperComponent implements GlHeaderItem {
  get headerComponent() {
    if (!this.originalComponent || !this.originalComponent.instance) {
      return undefined;
    }
    return this.originalComponent.instance.then(x => x.instance.headerComponent);
  }
  get additionalTokens() {
    if (!this.originalComponent || !this.originalComponent.instance) {
      return undefined;
    }
    return this.originalComponent.instance.then(x => x.instance.additionalTokens);
  }

  private originalComponent: any;

  constructor(
    @Inject(GoldenLayoutComponentHost) private host: any,
    @Inject(GoldenLayoutComponentState) private state: any,
  ) {
    this.originalComponent = (this.host.getGoldenLayoutInstance() as any)._getAllComponents()[this.state.originalId];
  }
}
