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
  Injector,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  StaticProvider,
  Type,
  ComponentRef,
} from '@angular/core';
import * as GoldenLayout from 'golden-layout';
import { ComponentRegistryService } from './component-registry.service';
import { FallbackComponent, FailedComponent } from './fallback';
import { RootWindowService } from './root-window.service';
import { Observable, Subscription, BehaviorSubject, of, Subject } from 'rxjs';
import { switchMap, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import {
  implementsGlOnResize,
  implementsGlOnShow,
  implementsGlOnHide,
  implementsGlOnTab,
  implementsGlOnClose,
  implementsGlOnPopin,
  implementsGlOnUnload,
  implementsGlOnPopout,
  uuid,
} from './type-guards';
import { Deferred } from './deferred';
import { WindowSynchronizerService } from './window-sync.service';
import { GoldenLayoutContainer, GoldenLayoutComponentState, GoldenLayoutEventHub, GoldenLayoutComponentHost, IExtendedGoldenLayoutConfig } from './tokens';

interface ComponentInitCallback extends Function {
  (container: GoldenLayout.Container, componentState: any): void;
}

// We need to wrap some golden layout internals, so we can intercept close and 'close stack'
// For close, the tab is wrapped and the close element to change the event handler to close the correct container.
const lm = GoldenLayout as any;

// This code wraps the original golden-layout Tab
// A tab is instantiated by the golden-layout Header
// We rebind the close event listener to properly dispose the angular item container
// In order to destroy the angular component ref and be able to defer the close.
const originalTab = lm.__lm.controls.Tab;
const newTab = function(header, contentItem) {
  const tab = new originalTab(header, contentItem);
  tab.closeElement.off('click touchstart');
  tab.closeElement.on('click touchstart', (ev) => {
    ev.stopPropagation();
    if (
      tab.contentItem.isComponent &&
      tab.contentItem.config &&
      tab.contentItem.config.componentState &&
      tab.contentItem.config.componentState.originalComponent
    ) {
      // If we have a dummy tab, close the actual tab behind it.
      tab.contentItem.config.componentState.originalComponent.container.close();
    } else {
      // Otherwise close our own tab.
      tab.contentItem.container.close();
    }
  });
  tab.element.off('mousedown touchstart', tab._onTabClickFn);
  tab.element.on('mousedown touchstart', ev => {
    tab._onTabClickFn(ev);
    let contentItem = tab.contentItem;
    if (
      tab.contentItem.isComponent &&
      tab.contentItem.config &&
      tab.contentItem.config.componentState &&
      tab.contentItem.config.componentState.originalComponent
    ) {
      contentItem = tab.contentItem.config.componentState.originalComponent;
    }
    contentItem.layoutManager.emit('tabActivated', contentItem);
  });
  return tab;
};
newTab._template = '<li class="lm_tab"><i class="lm_left"></i>' +
'<span class="lm_title"></span><div class="lm_close_tab"></div>' +
'<i class="lm_right"></i></li>';
lm.__lm.controls.Tab = newTab;


// Header is wrapped to catch the maximise and close buttons.
const originalHeader = lm.__lm.controls.Header;
const newHeader = function(layoutManager, parent) {
  const maximise = parent._header['maximise'];
  const popout = parent._header['popout'];
  if (maximise && layoutManager.config.settings.maximiseAllItems === true) {
    // Check whether we should maximise all stacks and if so, force the header to
    // not generate a maximise button.
    delete parent._header['maximise'];
  }
  if (popout && layoutManager.config.settings.maximiseAllItems === true) {
    delete parent._header['popout'];
  }

  // Generate the original header
  const header = new originalHeader(layoutManager, parent);

  // Check whether we should maximise all stacks, and if so, generate a custom popout button
  // but keep the order with the maximise and close button
  if (popout && layoutManager.config.settings.maximiseAllItems === true) {
    header.popoutButton = new lm.__lm.controls.HeaderButton(header, popout, 'lm_popout', () => {
      let contentItem = header.activeContentItem;
      if (
        contentItem.isComponent &&
        contentItem.config &&
        contentItem.config.componentState &&
        contentItem.config.componentState.originalComponent
      ) {
        // We are within the dummy stack, our component is a wrapper component
        // and has a reference to the original (= wrapped) component.
        // Therefore, popping out the whole stack would be stupid, because it wouldn't leave
        // any item in this window.
        contentItem = contentItem.config.componentState.originalComponent;
        contentItem.popout();
      } else if (layoutManager.config.settings.popoutWholeStack === true) {
        // We have a regular stack, so honor the popoutWholeStack setting.
        header.parent.popout();
      } else {
        contentItem.popout();
      }
    });
  }

  // Check whether we should maximise all stacks, and if so, generate a custom maximise button
  // but keep the order with the close button.
  if (maximise && layoutManager.config.settings.maximiseAllItems === true) {
    header.maximiseButton = new lm.__lm.controls.HeaderButton(header, maximise, 'lm_maximise', () => {
      // The maximise button was clicked, so create a dummy stack, containing a wrapper component for each opened component.
      console.log('I should maximise all items.');
      if (layoutManager._maximisedItem === parent) {
        parent.toggleMaximise();
      } else {
        layoutManager.generateAndMaximiseDummyStack(parent);
      }
    });
  }
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


// Patch the drag proxy in order to have an itemDragged event.
const origDragProxy = lm.__lm.controls.DragProxy;
const dragProxy = function(x, y, dragListener, layoutManager, contentItem, originalParent) {
  if (contentItem && contentItem.config && contentItem.config.componentState && contentItem.config.componentState.originalId) {
    // TBD: Fix this stuff to emit the event on the correct tab.
    return;
  }
  layoutManager.emit('itemDragged', contentItem);
  return new origDragProxy(x, y, dragListener, layoutManager, contentItem, originalParent);
}
lm.__lm.controls.DragProxy = dragProxy;

// Patch the stack in order to have an activeContentItemChanged$ observable
const origStack = lm.__lm.items.Stack;
function MyStack(lm, config, parent) {
  console.log(lm, config, parent, this);
  origStack.call(this, lm, config, parent);
  this.activeContentItem$ = new BehaviorSubject<any>(null);
  const callback = (ci) => {
    if (this.activeContentItem$) {
      this.activeContentItem$.next(ci)
    };
  };
  this.on('activeContentItemChanged', callback);
  const origDestroy = this._$destroy;
  this._$destroy = () => {
    this.off('activeContentItemChanged', callback);
    this.activeContentItem$.complete();
    this.activeContentItem$ = null;
    origDestroy.call(this);
  };
  return this;
}
MyStack.prototype = Object.create(origStack.prototype);

// Force stacks to be flattened.
MyStack.prototype['addChild'] = function(contentItem: GoldenLayout.ItemConfig, index: number) {
  if (contentItem.type === 'stack') {
    // We try to pop in a stack into another stack (i.e. nested tab controls.)
    // This breaks the other stuff in custom header components, therefore it's not recommended.
    // So we add the items directly into this stack.
    (contentItem.content || []).forEach((ci, idx) => origStack.prototype.addChild.call(this, ci, index + idx));
    if (contentItem.content.length) {
      this.setActiveContentItem(this.contentItems[index + (contentItem as any).activeItemIndex]);
    }
  } else {
    origStack.prototype.addChild.call(this, contentItem, index);
  }
};
MyStack.prototype['setSize'] = function() {
  if (this.layoutManager._maximisedItem === this) {
    // Actually enforce that this item will be the correct size
    this.element.width(this.layoutManager.container.width());
    this.element.height(this.layoutManager.container.height());
  }
  origStack.prototype.setSize.call(this);
};
lm.__lm.items.Stack = MyStack;

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

  @Input() layout: Observable<IExtendedGoldenLayoutConfig>;
  @Output() stateChanged = new EventEmitter<never>();
  @Output() tabActivated = new EventEmitter<GoldenLayout.ContentItem>();

  @ViewChild('glroot', { static: true }) private el: ElementRef;

  private goldenLayout: GoldenLayout = null;
  private onUnloaded = new Deferred<void>();
  private stateChangePaused = false;
  private stateChangeScheduled = false;
  private tabsList = new BehaviorSubject<{ [tabId: string]: GoldenLayout.ContentItem }>({});
  pushStateChange = () => {
    // For each state change, we want to refresh the list of the opened components. At the moment, we only care about the keys.
    this.tabsList.next((this.goldenLayout as any)._getAllComponents());
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
  pauseStateChange = () => {
    this.stateChangePaused = true;
    if (this.goldenLayout && (this.goldenLayout as any).__maximisedStack) {
      (this.goldenLayout as any)
    }
  }
  pushTabActivated = (ci: GoldenLayout.ContentItem) => {
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
  public beforeUnload() {
    if (this.poppedIn) {
      this.onUnloaded.promise.then(() => this.ngOnDestroy());
      this.onUnloaded.resolve();
      this.windowSync.onUnload();
    }
  }

  // Map beforeunload to onDestroy to simplify the handling
  @HostListener('window:pagehide')
  public pageHide() {
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
    let myConfig: GoldenLayout.ItemConfig = config;
    const root = this.goldenLayout.root;
    let element: GoldenLayout.ContentItem = null;
    if (!root.contentItems || root.contentItems.length === 0) {
      element = root;
      // Ensure there is a stack when closing ALL items and creating a new item.
      myConfig = {
        type: 'stack',
        content: [{
          ...myConfig,
          type: 'component',
        }],
      };
    } else {
      element = this.findStack(root.contentItems);
    }
    if (element === null) {
      throw new Error("this should never happen!");
    }

    const content = this.goldenLayout.createContentItem(myConfig) as any;
    element.addChild(content);
  }

  private findStack(contentItems: GoldenLayout.ContentItem[]): GoldenLayout.ContentItem {
    if (!contentItems) {
      return null;
    }
    for (const x of contentItems) {
      if (x.isStack) {
        if ((x.config as any).isDummy) {
          continue;
        }
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
    this.goldenLayout.off('tabActivated', this.pushTabActivated);
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
    const buildComponentMap = (item: GoldenLayout.ContentItem) => {
      let ret = {};
      for (const ci of item.contentItems) {
        if (ci.isComponent) {
          if (ci.config && (ci.config as any).componentState && (ci.config as any).componentState.originalId) {
            // Skip the dummy components
            continue;
          }
          ret[ci.id] = ci;
        } else {
          ret = { ...ret, ...buildComponentMap(ci) };
        }
      }
      return ret;
    };
    (this.goldenLayout as any)._getAllComponents = () => buildComponentMap(this.goldenLayout.root);
    (this.goldenLayout as any).generateAndMaximiseDummyStack = (parent) => {
      const openedComponents = this.tabsList.value;
      const componentIdList = Object.keys(openedComponents);
      if (componentIdList.length === 0) {
        return; // How did we get here?!
      }

      // We only have a single child, so we restore the original behavior
      const rootContentItem = this.goldenLayout.root.contentItems[0];
      if (rootContentItem.isStack) {
        rootContentItem.toggleMaximise();
        return;
      }

      const config = {
        type: 'stack',
        content: componentIdList.map(k => ({
          type: 'component',
          componentName: 'gl-wrapper',
          title: openedComponents[k].config.title,
          reorderEnabled: false,
          componentState: { originalId: k, originalComponent: openedComponents[k] },
        })),
        isClosable: false,
        isDummy: true,
        state: 'dummy',
        activeItemIndex: componentIdList.findIndex(j => j === parent._activeContentItem.id),
      }
      rootContentItem.addChild(config, 0);
      const myStack = rootContentItem.contentItems[0] as GoldenLayout.ContentItem;
      const teardown$ = new Subject();
      myStack.on('minimised', () => {
        console.log('minimised', myStack);
        teardown$.next();
        teardown$.complete();
        myStack.remove()
      });
      myStack.toggleMaximise();
      this.tabsList.pipe(
        takeUntil(teardown$),
        distinctUntilChanged((a, b) => {
          const keysA = Object.keys(a);
          const keysB = new Set(Object.keys(b));
          return keysA.length === keysB.size && keysA.every(key => keysB.has(key));
        }),
      ).subscribe(targetState => {
        const workingCopy = { ...targetState };
        const tabs = new Set(Object.keys(workingCopy));
        const openedTabs = new Set(myStack.contentItems.map(ci => {
          return (ci.config as any).componentState.originalId;
        }));
        for (const key of tabs) {
          if (openedTabs.has(key)) {
            openedTabs.delete(key);
          } else {
            myStack.addChild({
              type: 'component',
              componentName: 'gl-wrapper',
              title: targetState[key].config.title,
              reorderEnabled: false,
              componentState: { originalId: key, originalComponent: targetState[key] },
            } as any)
          }
        }
        for (const tab of openedTabs) {
          const tabObj = myStack.contentItems.find(j => (j.config as any).componentState.originalId === tab);
          tabObj.remove();
        }
      });
    };
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
      const customHeaderElement = document.createElement('li');
      customHeaderElement.classList.add('custom-header');
      customHeaderElement.style.display = 'none';
      const ctr = stack.header.controlsContainer[0] as HTMLUListElement;
      let element: ComponentRef<any> = null;

      ctr.prepend(customHeaderElement);

      const disposeControl = () => {
        customHeaderElement.style.display = 'none';
        if (element) {
          customHeaderElement.childNodes.forEach(e => customHeaderElement.removeChild(e));
          element.destroy();
          element = null;
        }
      };
      const bootstrapComponent = (ct: Type<any>, tokens: StaticProvider[], injector: Injector) => {
        if (element) {
          disposeControl();
        }
        customHeaderElement.style.display = '';
        const factory = this.componentFactoryResolver.resolveComponentFactory(ct);
        const headerInjector = Injector.create(tokens, injector);
        element = this.viewContainer.createComponent(factory, undefined, headerInjector);
        customHeaderElement.prepend(element.location.nativeElement);
      };

      // Wait until the content item is loaded and done
      stack.activeContentItem$.pipe(
        switchMap((contentItem: GoldenLayout.ContentItem) => {
          if (!contentItem || !contentItem.isComponent) {
            return of(null);
          }
          return (contentItem as any).instance || of(null);
        }), switchMap((cr: ComponentRef<any> | null) => {
          if (!cr) {
            return Promise.all([null, null, null]);
          }
          const inst = cr.instance.headerComponent;
          const tokens = cr.instance.additionalTokens;
          return Promise.all([
            Promise.resolve(inst),
            Promise.resolve(tokens),
            Promise.resolve(cr)
          ]);
        })
      ).subscribe(([header, tokens, componentRef]) => {
        // This is the currently visible content item, after it's loaded.
        // Therefore, we can check whether (and what) to render as header component here.
        if (!header || !componentRef) {
          disposeControl();
        } else {
          bootstrapComponent(
            header,
            tokens || [],
            componentRef.injector
          );
        }
      }, disposeControl, disposeControl);
    });
    // Initialize the layout.
    this.goldenLayout.init();
    this.goldenLayout.on('stateChanged', this.pushStateChange);
    this.goldenLayout.on('itemDragged', this.pauseStateChange);
    this.goldenLayout.on('itemDropped', this.resumeStateChange);
    this.goldenLayout.on('tabActivated', this.pushTabActivated);
  }

  /**
   * Build a 'virtual' constructor which is used to pass the components to goldenLayout
   * @param componentType
   */
  private buildConstructor(componentName: string): ComponentInitCallback {
    // Can't use an ES6 lambda here, since it is not a constructor
    const self = this;
    return function (container: GoldenLayout.Container, componentState: any) {
      const glComponent = container.parent;
      (glComponent as any).id = uuid();

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
          d.resolve(componentRef);
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
