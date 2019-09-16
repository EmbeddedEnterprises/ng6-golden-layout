import { GlOnResize, GlOnShow, GlOnHide, GlOnTab, GlOnClose, GlOnPopin, GlOnUnload, GlOnPopout, GlHeaderItem } from "./hooks";

/**
 * Type guard which determines if a component implements the GlOnResize interface.
 */
export function implementsGlOnResize(obj: any): obj is GlOnResize {
  return typeof obj === 'object' && typeof obj.glOnResize === 'function';
}

/**
 * Type guard which determines if a component implements the GlOnShow interface.
 */
export function implementsGlOnShow(obj: any): obj is GlOnShow {
  return typeof obj === 'object' && typeof obj.glOnShow === 'function';
}

/**
 * Type guard which determines if a component implements the GlOnHide interface.
 */
export function implementsGlOnHide(obj: any): obj is GlOnHide {
  return typeof obj === 'object' && typeof obj.glOnHide === 'function';
}

/**
 * Type guard which determines if a component implements the GlOnTab interface.
 */
export function implementsGlOnTab(obj: any): obj is GlOnTab {
  return typeof obj === 'object' && typeof obj.glOnTab === 'function';
}

/**
 * Type guard which determines if a component implements the GlOnClose interface.
 */
export function implementsGlOnClose(obj: any): obj is GlOnClose {
  return typeof obj === 'object' && typeof obj.glOnClose === 'function';
}

export function implementsGlOnPopin(obj: any): obj is GlOnPopin {
  return typeof obj === 'object' && typeof obj.glOnPopin === 'function';
}
export function implementsGlOnUnload(obj: any): obj is GlOnUnload {
  return typeof obj === 'object' && typeof obj.glOnUnload === 'function';
}
export function implementsGlOnPopout(obj: any): obj is GlOnPopout {
  return typeof obj === 'object' && typeof obj.glOnPopout === 'function';
}
export function implementsGlHeaderItem(obj: any): obj is GlHeaderItem {
  return typeof obj === 'object' && typeof obj.headerComponent === 'function';
}
