declare global {
  namespace NodeJS {
    interface Global {
      tickBeginHook: (() => void)[];
      tickEndHook: (() => void)[];
      CreepManager: any;
    }
  }
}
export {};
