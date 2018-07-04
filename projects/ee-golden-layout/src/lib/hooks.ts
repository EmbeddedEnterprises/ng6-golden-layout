import * as GoldenLayout from 'golden-layout';

/**
 * Hook invoked after a component's container or the document has been resized.
 */
export interface GlOnResize {
  /**
   * Invoked when the 'resize' event fires on the component's parent GoldenLayout Container.
   */
  glOnResize(): void;
}

/**
 * Hook invoked before a component's container is shown.
 */
export interface GlOnShow {
  /**
   * Invoked when the 'show' event fires on the component's parent GoldenLayout Container.
   */
  glOnShow(): void;
}

/**
 * Hook invoked before a component's container is hidden.
 */
export interface GlOnHide {
  /**
   * Invoked when the 'hide' event fires on the component's parent GoldenLayout Container.
   */
  glOnHide(): void;
}

/**
 * Hook invoked after component's container tab is shown
 */
export interface GlOnTab {
  /**
   * Invoked when the 'tab' event fires on the component's parent GoldenLayout Container.
   */
  glOnTab(): void;
}
