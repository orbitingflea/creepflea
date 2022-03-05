export {}

declare global {
  namespace NodeJS {
    interface Global {
      // NOTHING_TO_DO: number;
      // RUNNING: number;
    }
  }

  const NOTHING_TO_DO = 1;
  const COMPLETE_WITHOUT_MOVE = 2;
  const ERR_NO_PARKABLE_POS = -20;
  const GIVE_UP = 3;
  const BLOCKED = 4;
}
