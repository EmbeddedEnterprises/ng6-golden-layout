import { Component, ViewEncapsulation, Inject, OnInit, ComponentRef, OnDestroy } from '@angular/core';
import { GlHeaderItem, GlOnHide, GlOnShow, GlOnResize, GlOnTab } from './hooks';
import { GoldenLayoutComponentHost, GoldenLayoutComponentState, GoldenLayoutContainer } from './tokens';
import { implementsGlOnResize, implementsGlOnHide, implementsGlOnShow, implementsGlOnTab } from './type-guards';

@Component({
  selector: 'gl-wrapper',
  encapsulation: ViewEncapsulation.None,
  template: `<div class="wrapper"></div>`
})
export class WrapperComponent implements
  GlHeaderItem,
  OnInit,
  OnDestroy,
  GlOnHide,
  GlOnShow,
  GlOnResize,
  GlOnTab
 {
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
  private destroyed = false;
  private initialized = false;

  constructor(
    @Inject(GoldenLayoutComponentHost) private host: any,
    @Inject(GoldenLayoutContainer) private container: any,
    @Inject(GoldenLayoutComponentState) private state: any,
  ) {
    this.originalComponent = (this.host.getGoldenLayoutInstance() as any)._getAllComponents()[this.state.originalId];
  }


  ngOnInit() {
    this.originalComponent.instance.then((componentRef: ComponentRef<any>) => {
      if (this.destroyed || this.initialized) {
        return;
      }
      this.redock(componentRef, this.container.getElement());
      this.initialized = true;
    })
  }

  ngOnDestroy() {
    this.originalComponent.instance.then((cr: ComponentRef<any>) => {
      if (!this.initialized || this.destroyed) {
        return;
      }
      this.redock(cr, this.originalComponent.container.getElement());
      this.destroyed = true;
    })
  }

  private redock(componentRef: ComponentRef<any>, to: JQuery) {
    const el = $(componentRef.location.nativeElement);
    el.remove();
    to.append(el);
    if (implementsGlOnResize(componentRef.instance)) {
      componentRef.instance.glOnResize();
    }
  }

  glOnHide() {
    this.originalComponent.instance.then((cr: ComponentRef<any>) => {
      if (implementsGlOnHide(cr.instance)) {
        cr.instance.glOnHide();
      }
    });
  }
  glOnShow() {
    this.originalComponent.instance.then((cr: ComponentRef<any>) => {
      if (implementsGlOnShow(cr.instance)) {
        cr.instance.glOnShow();
      }
    });
  }
  glOnResize() {
    this.originalComponent.instance.then((cr: ComponentRef<any>) => {
      if (implementsGlOnResize(cr.instance)) {
        cr.instance.glOnResize();
      }
    });
  }
  glOnTab(tab: any) {
    this.originalComponent.instance.then((cr: ComponentRef<any>) => {
      if (implementsGlOnTab(cr.instance)) {
        debugger;
        cr.instance.glOnTab(this.originalComponent.tab);
      }
    });
  }
}
