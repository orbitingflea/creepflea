/**
 * 本文件实现了 Room.cache。
 */

global._roomCache = {
  data: {},
  get: function(name: string): RoomCache {
    if (!(name in this.data)) {
      this.data[name] = {};
    }
    return this.data[name];
  },
  set: function(name: string, value: RoomCache): void {
    this.data[name] = value;
  }
};

Object.defineProperty(Room.prototype, 'cache', {
  configurable: true,
  get: function(): RoomCache {
    return global._roomCache.get(this.name) as RoomCache;
  },
  set: function(value: RoomCache): void {
    global._roomCache.set(this.name, value);
  }
});

global.roomCache = function(roomName: string): RoomCache {
  return global._roomCache.get(roomName);
}
