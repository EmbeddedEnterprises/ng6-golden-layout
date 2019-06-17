import { InjectionToken, Type } from '@angular/core';

/**
 * Inject an angular component using this token to indicate
 * that the component should be rendered when there is an error rendering
 * the actual component.
 * Errors could be exceptions thrown at construction time or a not-registered component.
 */
export const FallbackComponent = new InjectionToken<Type<any>>("fallback component");

/**
 * This token is injected into the FallbackComponent when it is instantiated and contains
 * the name of the component that failed to initialize.
 */
export const FailedComponent = new InjectionToken<string>("failed component");
