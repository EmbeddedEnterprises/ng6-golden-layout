export class Deferred<T> {
  public promise: Promise<T>;
  public resolve: (val: T) => void;
  public reject: (reason: Error | string) => void;
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
