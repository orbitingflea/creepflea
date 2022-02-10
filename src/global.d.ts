declare global {
  namespace NodeJS {
    interface Global {
      tickBeginHook: (() => void)[];
      tickEndHook: (() => void)[];
      creepManager: CreepManager;

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

      _roomCache: {
        data: { [name: string]: RoomCache };
        get: (name: string) => RoomCache;
        set: (name: string, value: RoomCache) => void;
      };
      roomCache: (name: string) => RoomCache;

      roomObjectCache: {
        data: { [id: string]: Object };
        get: (id: Id<RoomObject>) => Object | null;
        set: (id: Id<RoomObject>, value: Object) => void;
      };

      roomDanger: (roomName: string) => DangerInfo | null;
      roomLairRegions: (roomName: string) => LairRegionStatic[];
      decodeRoomPosition: (code: string) => RoomPosition;
    }
  }
}

export {};
