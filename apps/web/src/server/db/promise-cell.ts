/* eslint-disable @typescript-eslint/no-explicit-any */
export class PromiseCell<T = void> extends Promise<T> {
  resolved = false;
  value!: Promise<T>;

  private _resolve!: (value: T) => void;
  private _reject!: (reason?: any) => void;

  private constructor(
    executor: (
      resolve: (value: T) => void,
      reject: (reason?: any) => void,
    ) => void,
  ) {
    super(executor);
  }

  static create<T = void>() {
    let resolve: (value: T) => void = () => {};
    let reject: (reason?: any) => void = () => {};

    const promise = new PromiseCell<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    promise._resolve = resolve;
    promise._reject = reject;
    promise.value = promise;

    return promise;
  }

  expiresIn(ms: number) {
    setTimeout(() => {
      if (this.resolved) {
        return;
      }

      this.reject(new Error('Promise expired'));
    }, ms);

    return this;
  }

  resolve(value: T) {
    if (this.resolved) {
      return;
    }

    this.resolved = true;
    this._resolve(value);
  }

  reject(reason?: any) {
    if (this.resolved) {
      return;
    }

    this.resolved = true;
    this._reject(reason);
  }
}
