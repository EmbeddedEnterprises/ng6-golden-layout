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
import { Observable, Subscription, BehaviorSubject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  implementsGlOnResize,
  implementsGlOnShow,
  implementsGlOnHide,
  implementsGlOnTab,
  implementsGlOnClose,
  implementsGlOnPopin,
  implementsGlOnUnload,
  implementsGlOnPopout,
  implementsGlHeaderItem,
} from './type-guards';
import { Deferred } from './deferred';
import { WindowSynchronizerService } from './window-sync.service';

export const GoldenLayoutContainer = new InjectionToken('GoldenLayoutContainer');
export const GoldenLayoutComponentState = new InjectionToken('GoldenLayoutComponentState');
export const GoldenLayoutEventHub = new InjectionToken('GoldenLayoutEventHub');
export const GoldenLayoutComponentHost = new InjectionToken('GoldenLayoutComponentHost');

interface ComponentInitCallback extends Function {
  (container: GoldenLayout.Container, componentState: any): void;
}

// We need to wrap some golden layout internals, so we can intercept close and 'close stack'
// For close, the tab is wrapped and the close element to change the event handler to close the correct container.
const lm = GoldenLayout as any;
const originalTab = lm.__lm.controls.Tab;
const newTab = function(header, contentItem) {
  const tab = new originalTab(header, contentItem);
  tab.closeElement.off('click touchstart');
  tab.closeElement.on('click touchstart', (ev) => {
    ev.stopPropagation();
    tab.contentItem.container.close();
  });
  return tab;
};
newTab._template = '<li class="lm_tab"><i class="lm_left"></i>' +
'<span class="lm_title"></span><div class="lm_close_tab"></div>' +
'<i class="lm_right"></i></li>';
lm.__lm.controls.Tab = newTab;

// Stack close is implemented using a wrapped header which iterates through the content items
// and calls the correct close method.
const originalHeader = lm.__lm.controls.Header;
const newHeader = function(layoutManager, parent) {
  const header = new originalHeader(layoutManager, parent);
  if (header.closeButton) {
    header.closeButton._$destroy();
    const label = header._getHeaderSetting('close');
    header.closeButton = new lm.__lm.controls.HeaderButton(header, label, 'lm_close', () => {
      header.parent.contentItems.forEach(ci => {
        ci.container.close();
      });
    });
  }
  return header;
};
newHeader._template = [
	'<div class="lm_header">',
	'<ul class="lm_tabs"></ul>',
	'<ul class="lm_controls"></ul>',
	'<ul class="lm_tabdropdown_list"></ul>',
	'</div>'
].join( '' );
lm.__lm.controls.Header = newHeader;

const origDragProxy = lm.__lm.controls.DragProxy;
const dragProxy = function(x, y, dragListener, layoutManager, contentItem, originalParent) {
  layoutManager.emit('itemDragged', contentItem);
  return new origDragProxy(x, y, dragListener, layoutManager, contentItem, originalParent);
}
lm.__lm.controls.DragProxy = dragProxy;

const origStack = lm.__lm.items.Stack;
const stackProxy = function(lm, config, parent) {
  origStack.call(this, lm, config, parent);
  this.activeContentItem$ = new BehaviorSubject<any>(null);
  const callback = (ci) => this.activeContentItem$.next(ci);
  this.on('activeContentItemChanged', callback);
  const origDestroy = this._$destroy;
  this._$destroy = () => {
    this.off('activeContentItemChanged', callback);
    this.activeContentItem$.complete();
    origDestroy.call(this);
  };
  return this;
}
lm.__lm.utils.extend(stackProxy, origStack);
lm.__lm.items.Stack = stackProxy;

const origPopout = lm.__lm.controls.BrowserPopout;
const popout = function(config: GoldenLayout.ItemConfig[], dimensions, parent, index, lm) {
  if (config.length !== 1) {
    console.warn('This should not happen, permitting', config);
  } else {
    if (config[0].type === 'component') {
      config = [{
        type: 'stack',
        title: config[0].title, // Required for adjustToWindowMode to work. (Line 1282 in 1.5.9)
        content: [config[0]],
      }];
    }
  }
  return new origPopout(config, dimensions, parent, index, lm);
};
lm.__lm.controls.BrowserPopout = popout;

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
  @Output() stateChanged = new EventEmitter<never>();
  @Output() tabActivated = new EventEmitter<GoldenLayout.ContentItem>();

  @ViewChild('glroot', { static: true }) private el: ElementRef;

  private goldenLayout: GoldenLayout = null;
  private onUnloaded = new Deferred<void>();
  private stateChangePaused = false;
  private stateChangeScheduled = false;
  pushStateChange = () => {
    if (this.stateChangePaused || this.stateChangeScheduled) {
      return;
    }
    this.stateChangeScheduled = true;
    window.requestAnimationFrame(() => {
      this.stateChangeScheduled = false;
      this.stateChanged.emit()
    });
  };

  resumeStateChange = () => this.stateChangePaused = false;
  pauseStateChange = () => this.stateChangePaused = true;
  pushTabActivated = (ci: GoldenLayout.ContentItem) => {
    console.log('activeContentItemChanged', ci);
    this.tabActivated.emit(ci);
  }

  private isChildWindow: boolean;

  private fallbackType: ComponentInitCallback = null;
  private layoutSubscription: Subscription;
  private openedComponents = [];
  private poppedIn = false;

  @HostListener('window:resize')
  public onResize(): void {
    if (this.goldenLayout) {
      this.goldenLayout.updateSize();
    }
  }

  constructor(
    private rootService: RootWindowService,
    private componentRegistry: ComponentRegistryService,
    private viewContainer: ViewContainerRef,
    private appref: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private ngZone: NgZone,
    private readonly injector: Injector,
    private windowSync: WindowSynchronizerService,
    @Optional() @Inject(FallbackComponent) private readonly fallbackComponent: any
  ) {
    this.isChildWindow = this.rootService.isChildWindow();

    if (!!this.fallbackComponent) {
      this.fallbackType = this.buildConstructor(this.fallbackComponent);
    }

    if (isDevMode()) console.log(`Create@${this.isChildWindow ? 'child' : 'root'}!`);
  }

  public ngOnInit(): void {
    if (isDevMode()) console.log(`Init@${this.isChildWindow ? 'child' : 'root'}!`);

    this.layoutSubscription = this.layout.subscribe(layout => {
      this.destroyGoldenLayout();
      this.initializeGoldenLayout(layout);
    });
  }

  // Map beforeunload to onDestroy to simplify the handling
  @HostListener('window:beforeunload')
  public onUnload() {
    if (!this.poppedIn) {
      this.openedComponents.forEach(c => {
        if (implementsGlOnUnload(c)) {
          c.glOnUnload();
        }
      });
    }
    this.onUnloaded.promise.then(() => this.ngOnDestroy());
    this.onUnloaded.resolve();
    this.windowSync.onUnload();
  }

  public ngOnDestroy(): void {
    if (isDevMode()) {
      console.log(`Destroy@${this.isChildWindow ? 'child' : 'root'}!`);
    }
    this.layoutSubscription.unsubscribe();

    // restore the original tick method.
    // this appens in two cases:
    // either the window is closed, after that it's not important to restore the tick method
    // or within the root window, where we HAVE to restore the original tick method
    this.appref.tick = (this.appref as any).__tick;
    this.destroyGoldenLayout();

    if (this.isChildWindow) {
      console.log = (console as any).__log;
    }
  }

  public getGoldenLayoutInstance(): GoldenLayout {
    if (!this.goldenLayout) {
      throw new Error('Component is not initialized yet');
    }
    return this.goldenLayout;
  }

  public getSerializableState(): any {
    if (this.goldenLayout) {
      return this.goldenLayout.toConfig();
    }
    return null;
  }

  public createNewComponent(config: GoldenLayout.ComponentConfig) {
    if (!this.goldenLayout) {
      throw new Error("golden layout is not initialized");
    }
    const content = this.goldenLayout.createContentItem({
      ...config,
      type: 'component',
    }) as any;
    const root = this.goldenLayout.root;
    let element: GoldenLayout.ContentItem = null;
    if (!root.contentItems || root.contentItems.length === 0) {
      element = root;
    } else {
      element = this.findStack(root.contentItems);
    }
    if (element === null) {
      throw new Error("this should never happen!");
    }
    element.addChild(content);
  }

  private findStack(contentItems: GoldenLayout.ContentItem[]): GoldenLayout.ContentItem {
    if (!contentItems) {
      return null;
    }
    for (const x of contentItems) {
      if (x.isStack) {
        return x;
      }
      const s = this.findStack(x.contentItems);
      if (s !== null) {
        return s;
      }
    }
  }

  private destroyGoldenLayout(): void {
    if (!this.goldenLayout) {
      return;
    }
    this.goldenLayout.off('stateChanged', this.pushStateChange);
    this.goldenLayout.off('itemDropped', this.resumeStateChange);
    this.goldenLayout.off('itemDragged', this.pauseStateChange);
    this.goldenLayout.off('activeContentItemChanged', this.pushTabActivated);
    this.goldenLayout.destroy();
    this.goldenLayout = null;
  }

  private initializeGoldenLayout(layout: any): void {
    this.goldenLayout = new GoldenLayout(layout, $(this.el.nativeElement));
    const origPopout = this.goldenLayout.createPopout.bind(this.goldenLayout);
    this.goldenLayout.createPopout = (item: GoldenLayout.ContentItem, dim, parent, index) => {
      const rec = [item];
      while(rec.length) {
        const itemToProcess = rec.shift();
        rec.push(...itemToProcess.contentItems);
        if (itemToProcess.isComponent) {
          const component = (itemToProcess as any).container.__ngComponent;
          if (component && implementsGlOnPopout(component)) {
            component.glOnPopout();
          }
        }
        console.log(itemToProcess);
      }
      console.log('beforepopout', item);
      return origPopout(item, dim, parent, index);
    }
    this.goldenLayout.on('popIn', () => {
      console.log('popIn');
      this.poppedIn = true;
      this.openedComponents.forEach(c => {
        if (implementsGlOnPopin(c)) {
          c.glOnPopin();
        }
      });
    });

    // Overwrite the 'getComponent' method to dynamically resolve JS components.
    this.goldenLayout.getComponent = (type) => {
      if (isDevMode()) {
        console.log(`Resolving component ${type}`);
      }
      return this.buildConstructor(type);
    };
    this.goldenLayout.on('stackCreated', (stack) => {
      // Wait until the content item is loaded and done
      stack.activeContentItem$.pipe(switchMap((contentItem: any) => {
        if (!contentItem) {
          return of(null);
        }
        return contentItem.instance;
      })).subscribe(j => {
        // This is the currently visible content item, after it's loaded.
        // Therefore, we can check whether (and what) to render as header component here.
        console.log('instance', j);
      }, err => {
        // Currently visible content item, but we don't have an item or the loading failed, so no header.
        // -> Destroy the currently rendered header.
        console.log('Error loading instance:', err)
      }, () => {
        // Stack was closed.
        // -> Destroy the currently rendered header.
        console.log('Stack collapsed');
      });
    })
    // Initialize the layout.
    this.goldenLayout.init();
    this.goldenLayout.on('stateChanged', this.pushStateChange);
    this.goldenLayout.on('itemDragged', this.pauseStateChange);
    this.goldenLayout.on('itemDropped', this.resumeStateChange);
    this.goldenLayout.on('activeContentItemChanged', this.pushTabActivated);
  }

  /**
   * Build a 'virtual' constructor which is used to pass the components to goldenLayout
   * @param componentType
   */
  private buildConstructor(componentName: string): ComponentInitCallback {
    // Can't use an ES6 lambda here, since it is not a constructor
    const self = this;
    return function (container: GoldenLayout.Container, componentState: any) {
      const d = new Deferred<any>();
      self.ngZone.run(() => {
        // Wait until the component registry can provide a type for the component
        // TBD: Maybe add a timeout here?
        const componentPromise = self.componentRegistry.waitForComponent(componentName);
        componentPromise.then((componentType) => {
          // We got our component type
          console.log(`Component ${componentName} returned from componentRegistry`);
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
          (container as any).__ngComponent = componentRef.instance;
          self.openedComponents.push(componentRef.instance);
          let destroyed = false;
          const destroyFn = () => {
            if (!destroyed) {
              destroyed = true;
              self.openedComponents = self.openedComponents.filter(i => i !== componentRef.instance);
              $(componentRef.location.nativeElement).remove();
              componentRef.destroy();
            }
          };

          // Listen to containerDestroy and window beforeunload, preventing a double-destroy
          container.on('destroy', destroyFn);
          self.onUnloaded.promise.then(destroyFn);
          d.resolve(componentRef.instance);
        });
      });
      return d.promise;
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
        useValue: container,
      },
      {
        provide: GoldenLayoutComponentState,
        useValue: componentState,
      },
      {
        provide: GoldenLayoutEventHub,
        useValue: this.goldenLayout.eventHub,
      },
      {
        provide: GoldenLayoutComponentHost,
        useValue: this,
      }
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
      const containerClose = container.close.bind(container);
      container.close = () => {
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
