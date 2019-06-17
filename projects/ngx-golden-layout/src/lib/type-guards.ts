import { GlOnResize, GlOnShow, GlOnHide, GlOnTab, GlOnClose } from "./hooks";

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
