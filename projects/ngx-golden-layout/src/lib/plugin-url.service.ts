import { MultiWindowService } from './multiwindow-service';
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';


export interface IPluginURL {
  id: string,
  url: string,
};

/**
 * This class manages plugin load and unload requests across all windows.
 * Because we can't have progress reporting about all windows, we also don't
 * return any progress/success indicator here.
 */
@MultiWindowService<PluginURLProvider>('_gl__PluginURLProvider')
@Injectable()
export class PluginURLProvider {
  private loadedURLs = new Map<string, string>();
  private loads = new Subject<IPluginURL>();
  private unloads = new Subject<string>();

  public loadRequests$(): Observable<IPluginURL> {
    return this.loads;
  }
  public unloadRequests$(): Observable<string> {
    return this.unloads;
  }
  public allPlugins(): IPluginURL[] {
    return [...this.loadedURLs.entries()].map(p => ({ id: p[0], url: p[1] }));
  }

  public requestLoad(id: string, url: string) {
    const p = this.loadedURLs.get(id);
    if (p) {
      if (p !== url) {
        throw new Error(`Plugin ${id} is already loaded with another URL`);
      }
      return;
    }
    this.loadedURLs.set(id, url);
    this.loads.next({ id, url });
  }

  public requestUnload(id: string) {
    const p = this.loadedURLs.get(id);
    if (!p) {
      throw new Error(`Plugin ${id} is not loaded`);
    }
    this.loadedURLs.delete(id);
    this.unloads.next(id);
  }
}
