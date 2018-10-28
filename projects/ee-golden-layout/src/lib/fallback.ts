import { InjectionToken } from '@angular/core';

export const FallbackComponent = new InjectionToken("fallback component");
export const FailedComponent = new InjectionToken<string>("failed component");
