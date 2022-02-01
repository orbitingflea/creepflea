declare global {
  namespace NodeJS {
    interface Global {
      tickBeginHook: (() => void)[];
      tickEndHook: (() => void)[];
      CreepManager: any;  // 在 main.ts 中使用的 js 内容，将在未来整改

      staticCache: {
        data: { [key: string]: { updateTime: number, value: Object } };
        get: (key: string, ttl?: number) => Object | null;
        set: (key: string, value: Object) => void;
      };

      creepCache: {
        data: { [id: string]: Object };
        get: (id: Id<Creep>) => Object | null;
        set: (id: Id<Creep>, value: Object) => void;
      };

      roomCache: {
        data: { [name: string]: Object };
        get: (name: string) => Object | null;
        set: (name: string, value: Object) => void;
      };

      roomObjectCache: {
        data: { [id: string]: Object };
        get: (id: Id<RoomObject>) => Object | null;
        set: (id: Id<RoomObject>, value: Object) => void;
      };
    }
  }
}

export {};
