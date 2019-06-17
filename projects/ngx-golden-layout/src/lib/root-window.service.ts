import { Injectable } from '@angular/core';

@Injectable()
export class RootWindowService {

  constructor() {}

  public isChildWindow(): boolean {
    try {
      return !!window.opener && !!window.opener.location.href;
    } catch (e) {
      return false;
    }
  }

  public getRootWindow(): Window {
    return this.isChildWindow() ? window.opener : window;
  }
}
