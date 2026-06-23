declare module "aes-js" {
  export const utils: {
    hex: {
      fromBytes(bytes: Uint8Array): string;
      toBytes(hex: string): Uint8Array;
    };
    utf8: {
      fromBytes(bytes: Uint8Array): string;
      toBytes(str: string): Uint8Array;
    };
  };
  export class Counter {
    constructor(value: number);
  }
  export const ModeOfOperation: {
    ctr: new (key: Uint8Array, counter: Counter) => {
      encrypt(bytes: Uint8Array): Uint8Array;
      decrypt(bytes: Uint8Array): Uint8Array;
    };
  };
}
