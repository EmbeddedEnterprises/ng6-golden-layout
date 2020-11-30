import { Injectable, ApplicationRef, Injector } from '@angular/core';
import { RootWindowService } from './root-window.service';

@Injectable()
export class MockWindowSynchronizerService {
  restoreAppRefTick() {}
  onUnload() {}
}

@Injectable()
export class WindowSynchronizerService {
  private topWindow: Window;
  private isChildWindow: boolean;
  private unloaded = false;

  constructor(
    private appref: ApplicationRef,
    private rootService: RootWindowService,
    private injector: Injector,
  ) {
    this.topWindow = this.rootService.getRootWindow();
    this.isChildWindow = this.rootService.isChildWindow();

    if (this.isChildWindow) {
      window.document.title = window.document.URL;
      (console as any).__log = console.log;
      console.log = (...args: any[]) => (this.topWindow as any).console.log('[CHILD] =>', ...args);
    }

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
  }

  public restoreAppRefTick() {
    this.appref.tick = (this.appref as any).__tick;
  }

  public onUnload() {
    if (this.unloaded) {
      return;
    }
    this.unloaded = true;
    if (this.isChildWindow) {
      const index = (this.topWindow as any).__apprefs.indexOf(this.appref);
      if (index >= 0) {
        (this.topWindow as any).__apprefs.splice(index, 1);
      }
    }
  }
}
