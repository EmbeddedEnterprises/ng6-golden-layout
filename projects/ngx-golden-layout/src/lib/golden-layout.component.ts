import {
  isDevMode,
  ComponentFactoryResolver,
  HostListener,
  ViewContainerRef,
  ElementRef,
  Component,
  OnInit,
  OnDestroy,
  ApplicationRef,
  Type,
  Optional,
  Inject,
  NgZone,
  InjectionToken,
  Injector,
  ViewChild,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import * as GoldenLayout from 'golden-layout';
import { ComponentRegistryService } from './component-registry.service';
import { FallbackComponent, FailedComponent } from './fallback';
import { RootWindowService } from './root-window.service';
import { Observable, Subscription } from 'rxjs';
import { implementsGlOnResize, implementsGlOnShow, implementsGlOnHide, implementsGlOnTab, implementsGlOnClose } from './type-guards';

export const GoldenLayoutContainer = new InjectionToken('GoldenLayoutContainer');
export const GoldenLayoutComponentState = new InjectionToken('GoldenLayoutComponentState');

interface ComponentInitCallback extends Function {
  (container: GoldenLayout.Container, componentState: any): void;
}

class Deferred<T> {
  public promise: Promise<T>
  public resolve: (val?: T) => void;
  public reject: (err: any) => void;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

@Component({
  selector: 'golden-layout-root',
  styles: [`
    .ng-golden-layout-root {
      width:100%;
      height:100%;
    }`
  ],
  template: `<div class="ng-golden-layout-root" #glroot></div>`
})
export class GoldenLayoutComponent implements OnInit, OnDestroy {

  @Input() layout: Observable<GoldenLayout.Config>;
  @Output() stateChanged = new EventEmitter();

  @ViewChild('glroot', { static: true }) private el: ElementRef;

  private goldenLayout: GoldenLayout = null;
  private onUnloaded = new Deferred<void>();
  pushStateChange = () => this.stateChanged.emit();

  private topWindow: Window;
  private isChildWindow: boolean;

  private fallbackType: ComponentInitCallback = null;
  private layoutSubscription: Subscription;

  @HostListener('window:resize')
  public onResize(): void {
    if (this.goldenLayout) {
      this.goldenLayout.updateSize();
    }
  }

  constructor(
    private rootWindow: RootWindowService,
    private componentRegistry: ComponentRegistryService,
    private viewContainer: ViewContainerRef,
    private appref: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private ngZone: NgZone,
    private readonly injector: Injector,
    @Optional() @Inject(FallbackComponent) private readonly fallbackComponent: any
  ) {
    this.topWindow = this.rootWindow.getRootWindow();
    this.isChildWindow = this.rootWindow.isChildWindow();

    if (!!this.fallbackComponent) {
      this.fallbackType = this.buildConstructor(this.fallbackComponent);
    }

    if (this.isChildWindow) {
      window.document.title = window.document.URL;
      (console as any).__log = console.log;
      console.log = this.topWindow.console.log;
    }
    if (isDevMode()) console.log(`Create@${this.isChildWindow ? 'child' : 'root'}!`);
  }

  public ngOnInit(): void {
    if (isDevMode()) console.log(`Init@${this.isChildWindow ? 'child' : 'root'}!`);

    // Multi-Window compatibility.
    // We need to synchronize all appRefs that could tick
    // Store them in a global array and also overwrite the injector using the injector from the main window.
    let anyWin = this.topWindow as any;
    if (!this.isChildWindow) {
      anyWin.__apprefs = [];
      anyWin.__injector = this.injector;
    }

    // attach the application reference to the root window, save the original 'tick' method
    anyWin.__apprefs.push(this.appref);
    (this.appref as any).__tick = this.appref.tick;

    // Overwrite the tick method running all apprefs in their zones.
    this.appref.tick = (): void => {
      for (const ar of (this.topWindow as any).__apprefs) {
        ar._zone.run(() => ar.__tick());
      }
    };

    this.layoutSubscription = this.layout.subscribe(layout => {
      this.destroyGoldenLayout();
      this.initializeGoldenLayout(layout);
    });
  }

  // Map beforeunload to onDestroy to simplify the handling
  @HostListener('window:beforeunload', ['$event'])
  public ngOnDestroy(ev?: Event): void {
    if (isDevMode()) {
      console.log(`Destroy@${this.isChildWindow ? 'child' : 'root'}!`);
    }

    // TBD: If we're the root window, destroy the golden layout instance if we have one
    this.layoutSubscription.unsubscribe();
    if (ev) {
      // The event is defined -> window unload, destroy all components recursively
      // Use a promise to defer component destruction in case the child window is closed.
      this.onUnloaded.resolve();
    }

    if (this.isChildWindow) {
      const index = (this.topWindow as any).__apprefs.indexOf(this.appref);
      (this.topWindow as any).__apprefs.splice(index, 1);
      console.log = (console as any).__log;
    }

    // restore the original tick method.
    // this appens in two cases:
    // either the window is closed, after that it's not important to restore the tick method
    // or within the root window, where we HAVE to restore the original tick method
    this.appref.tick = (this.appref as any).__tick;
    this.destroyGoldenLayout();
  }

  public getSerializableState(): any {
    if (this.goldenLayout) {
      return this.goldenLayout.toConfig();
    }
    return null;
  }

  private destroyGoldenLayout(): void {
    if (!this.goldenLayout) {
      return;
    }
    (<GoldenLayout.EventEmitter>(<any>this.goldenLayout)).off('stateChanged', this.pushStateChange);
    this.goldenLayout.destroy();
    this.goldenLayout = null;
  }

  private initializeGoldenLayout(layout: any): void {
    this.goldenLayout = new GoldenLayout(layout, $(this.el.nativeElement));

    // Overwrite the 'getComponent' method to dynamically resolve JS components.
    this.goldenLayout.getComponent = (type) => {
      if (isDevMode()) {
        console.log(`Resolving component ${type}`);
      }
      const actualComponent = this.componentRegistry.componentMap().get(type);
      let component = this.fallbackType;
      if (actualComponent) {
        component = this.buildConstructor(actualComponent);
      }
      if (!component) {
        throw new Error(`Unknown component "${type}"`);
      }
      return component;
    };

    // Initialize the layout.
    this.goldenLayout.init();
    (<GoldenLayout.EventEmitter>(<any>this.goldenLayout)).on('stateChanged', this.pushStateChange);
  }

  /**
   * Build a 'virtual' constructor which is used to pass the components to goldenLayout
   * @param componentType
   */
  private buildConstructor(componentType: Type<any>): ComponentInitCallback {
    // Can't use an ES6 lambda here, since it is not a constructor
    const self = this;
    return function (container: GoldenLayout.Container, componentState: any) {
      self.ngZone.run(() => {
        // Create an instance of the angular component.
        const factory = self.componentFactoryResolver.resolveComponentFactory(componentType);
        let failedComponent: string = null;
        if (componentType === self.fallbackComponent) {
          // Failed to find the component constructor **AND** we have a fallback component defined,
          // so lookup the failed component's name and inject it into the fallback component.
          failedComponent = (container as any)._config.componentName;
        }
        const injector = self._createComponentInjector(container, componentState, failedComponent);
        const componentRef = self.viewContainer.createComponent(factory, undefined, injector);

        // Bind the new component to container's client DOM element.
        container.getElement().append($(componentRef.location.nativeElement));
        self._bindEventHooks(container, componentRef.instance);
        let destroyed = false;
        const destroyFn = () => {
          if (!destroyed) {
            destroyed = true;
            $(componentRef.location.nativeElement).remove();
            componentRef.destroy();
          }
        };

        // Listen to containerDestroy and window beforeunload, preventing a double-destroy
        container.on('destroy', destroyFn);
        self.onUnloaded.promise.then(destroyFn);
      });
    };
  }

  /**
   * Creates an injector capable of injecting the GoldenLayout object,
   * component container, and initial component state.
   */
  private _createComponentInjector(
    container: GoldenLayout.Container,
    componentState: any,
    failed: string | null,
  ): Injector {
    const providers = [
      {
        provide: GoldenLayoutContainer,
        useValue: container
      },
      {
        provide: GoldenLayoutComponentState,
        useValue: componentState
      },
      {
        provide: GoldenLayout,
        useValue: this.goldenLayout
      },
    ];
    if (!!failed) {
      providers.push({
        provide: FailedComponent,
        useValue: failed,
      });
    }
    return Injector.create(providers, this.injector);
  }

  /**
   * Registers an event handler for each implemented hook.
   * @param container Golden Layout component container.
   * @param component Angular component instance.
   */
  private _bindEventHooks(container: GoldenLayout.Container, component: any): void {
    if (implementsGlOnResize(component)) {
      container.on('resize', () => {
        component.glOnResize();
      });
    }

    if (implementsGlOnShow(component)) {
      container.on('show', () => {
        component.glOnShow();
      });
    }

    if (implementsGlOnHide(component)) {
      container.on('hide', () => {
        component.glOnHide();
      });
    }

    if (implementsGlOnTab(component)) {
      container.on('tab', (tab) => {
        component.glOnTab(tab);
      });
    }

    if (implementsGlOnClose(component)) {
      let hookEstablished = false;
      container.on('tab', (tab) => {
        /* GoldenLayout SHOULD send a tabEvent when the component is placed within a tab control, giving
           us access to the tab object, which allows us to patch the close handler to actually call the
           right close option.
        */
        if (hookEstablished) {
          return;
        }
        hookEstablished = true;
        tab.closeElement.off('click');
        tab._onCloseClick = (ev) => {
          ev.stopPropagation();
          tab.contentItem.container.close();
        };
        tab._onCloseClickFn = tab._onCloseClick.bind(tab);
        tab.closeElement.click(tab._onCloseClickFn);
      });

      const containerClose = container.close.bind(container);
      container.close = () => {
        console.log("Container close:", container);
        if (!(container as any)._config.isClosable) {
          return false;
        }
        component.glOnClose().then(() => {
          containerClose();
        }, () => { /* Prevent close, don't care about rejections */ });
      };
    }
  }
}
