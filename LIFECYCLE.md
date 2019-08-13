# Golden Layout Component Lifecycle hooks

To enable the developer to get notified when certain events in golden-layout occur, there are several
lifecycle interfaces which might be implemented by the developer.

Namely:

- GlOnShow - Notifies the component when it will be shown
- GlOnHide - Notifies the component when it will be hidden
- GlOnTab  - Notifies the component when the user activates another tab
- GlOnResize - Notifies the component when it is resized
- GlOnPopout - Notifies the component when it is about to pop out
- GlOnPopin - Notifies the component when it is about to pop back in
- GlOnUnload - Notifies the component when the window is about to close.
- GlOnClose - Notifies the component when the user wants to close the component via the tab close button or the stack close button.


Each of these interfaces defines one method to be implemented, for reference, here is a component which implements them all:

```ts
@Component({
  template: `<h1>Test</h1>`,
  selector: `app-test`,
})
export class TestComponent implements GlOnPopout, GlOnClose, GlOnHide, GlOnShow, GlOnPopin, GlOnResize, GlOnTab, GlOnUnload {
  glOnHide(): void {
    console.log('glOnHide');
  }
  glOnShow() {
    console.log('glOnShow');
  }
  glOnResize() {
    console.log('glOnResize');
  }  
  glOnTab() {
    console.log('glOnTab');
  }

  glOnPopin() {
    console.log('glOnPopin');
  }
  glOnPopout() {
    console.log('glOnPopout');
  }
  /**
   * You return a promise to either:
   * - cancel closing (reject)
   * - defer closing (resolve later)
   */
  async glOnClose(): Promise<void> {
    console.log('glOnClose');
  }
  glOnUnload() {
    console.log('glOnUnload');
  }


  
  ngOnInit() {
    console.log('Initialized');
  }
  ngOnDestroy() {
    console.log('Destroyed');
  }
}
```

## Interaction with Angular Lifecycles

To understand the following chapter, it is required to understand the [Angular Lifecycle Hooks](https://angular.io/guide/lifecycle-hooks).

A golden-layout components/panes lifecycle is decoupled from the lifecycle of the underlying Angular component. This means that your Angular component instance will be destroyed and re-initialized at certain state changes.

In a simple example, the lifecycle hooks might look like this:

1. ngOnInit
2. glOnShow (this might not fire, depending on the exact layout)
3. glOnResize
4. glOnClose
5. ngOnDestroy

In this case, the Angular component lifetime equals the golden-layout panes lifetime.

When the user wants to popout/popin, this no longer holds:

1. ngOnInit (root window)
2. glOnShow (depends)
3. glOnPopout (called BEFORE it pops out)
4. ngOnDestroy (root window)
5. ngOnInit (child window)
6. glOnShow (depends)
7. glOnPopin (called BEFORE it pops back in)
8. ngOnDestroy (child window)
9. ngOnInit (root window)
10. glOnShow (depends)
11. glOnClose 
12. ngOnDestroy

In this example, the golden-layout panes lifecycle spans the lifecycle of three Angular components. 
