import { Inject, Injectable, Type, Optional } from '@angular/core';
import { Subject } from 'rxjs';
import * as GoldenLayout from 'golden-layout';
import { GoldenLayoutConfiguration, ComponentConfiguration } from './config';
import { GoldenLayoutStateStore, StateStore, LocalStorageStateStore } from './state';

/**
 * golden-layout component initialization callback type.
 */
export interface ComponentInitCallback extends Function {
  (container: GoldenLayout.Container, componentState: any): void;
}

export interface ComponentInitCallbackFactory {
  createComponentInitCallback(component: Type<any>): ComponentInitCallback;
}

@Injectable()
export class GoldenLayoutService {
  private _layout: GoldenLayout = null;

  constructor(@Inject(GoldenLayoutConfiguration) public readonly config: GoldenLayoutConfiguration,
              @Optional() @Inject(GoldenLayoutStateStore) private readonly stateStore: StateStore) {}

  public initialize(goldenLayout: GoldenLayout, componentInitCallbackFactory: ComponentInitCallbackFactory) {
    this._layout = goldenLayout;
    this.config.components.forEach((componentConfig: ComponentConfiguration) => {
      const componentInitCallback = componentInitCallbackFactory.createComponentInitCallback(componentConfig.component);
      goldenLayout.registerComponent(componentConfig.componentName, componentInitCallback);
    });

    if (this.stateStore) {
      (<GoldenLayout.EventEmitter>(<any>goldenLayout)).on('stateChanged', () => {
        this._saveState(goldenLayout);
      });
    }
  }

  private _saveState(goldenLayout: GoldenLayout): void {
    if (this.stateStore && goldenLayout.isInitialised) {
      try {
        this.stateStore.writeState(goldenLayout.toConfig());
      } catch(ex) {
        // Workaround for https://github.com/deepstreamIO/golden-layout/issues/192
      }
    }
  }

  public getState(): Promise<any>{
    if (this.stateStore) {
      return this.stateStore.loadState().catch(() => {
        return this.config.defaultLayout;
      });
    }

    return Promise.resolve(this.config.defaultLayout);
  }

  public getRegisteredComponents(): ComponentConfiguration[] {
    return this.config.components;
  }

  public createNewComponent(comp: ComponentConfiguration) {
    // create content item
    const content = this._layout.createContentItem({type: 'component', componentName: comp.componentName }) as any;
    // search for the first lm-stack (a stack should be there always.)
    const root = this._layout.root;
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
      if (x.type === 'stack') {
        return x;
      }
      const s = this.findStack(x.contentItems);
      if (s !== null) {
        return s;
      }
    }
  }

  public isChildWindow(): boolean {
    return !!window.opener;
  }

  public getRootWindow(): Window {
    return window.opener || window;
  }
}
