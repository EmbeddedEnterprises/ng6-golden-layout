import { Tab } from 'golden-layout';

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
  glOnTab(tab: Tab): void;
}

/**
 * Hook invoked when a component is closed.
 */
export interface GlOnClose {
  /**
   * Invoked when the tab will be closed by the close button or stack close button.
   * Resolve the promise to actually close the component, reject to prevent the close operation.
   */
   glOnClose(): Promise<void>;
}

/**
 * Hook invoked when a component will be popped in
 */
export interface GlOnPopin {
  /**
   * Invoked when the component will be popped in.
   */
   glOnPopin(): void;
}

/**
 * Hook invoked when a component will be popped out
 */
export interface GlOnPopout {
  /**
   * Invoked when the tab will be popped out.
   */
   glOnPopout(): void;
}

/**
 * Hook invoked when the page is about to being unloaded (either popout window or root window)
 */
export interface GlOnUnload {
  /**
   * Invoked when the window is unloaded.
   */
   glOnUnload(): void;
}

