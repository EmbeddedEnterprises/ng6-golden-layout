import { InjectionToken, Provider } from '@angular/core';

export const GoldenLayoutStateStore = new InjectionToken('GoldenLayoutStateStore');

export interface StateStore {
  writeState(state:any): void;

  loadState(): Promise<any>
}

export const DEFAULT_LOCAL_STORAGE_STATE_STORE_KEY = '$ng-golden-layout-state';

export class LocalStorageStateStore implements StateStore {
  constructor(private readonly key: string) {}

  public writeState(state: any): void { 
    localStorage.setItem(this.key, JSON.stringify(state));
  }

  public loadState(): Promise<any> {
    const state = localStorage.getItem( this.key );
    return state 
      ? Promise.resolve(JSON.parse(state)) 
      : Promise.reject(`No state found using key: ${this.key}`);
  }
}

export function DEFAULT_LOCAL_STORAGE_STATE_STORE_FACTORY() {
  return new LocalStorageStateStore(DEFAULT_LOCAL_STORAGE_STATE_STORE_KEY);
}

export const DEFAULT_LOCAL_STORAGE_STATE_STORE = new LocalStorageStateStore(DEFAULT_LOCAL_STORAGE_STATE_STORE_KEY);

export const DEFAULT_LOCAL_STORAGE_STATE_STORE_PROVIDER: Provider = {
  provide: GoldenLayoutStateStore,
  useFactory: DEFAULT_LOCAL_STORAGE_STATE_STORE_FACTORY
};
