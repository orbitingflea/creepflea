/**
 * 本文件实现了 Room.cache。
 */

global.roomCache = {
  data: {},
  get: function(name: string): Object | null {
    if (!(name in this.data)) {
      this.data[name] = {};
    }
    return this.data[name];
  },
  set: function(name: string, value: Object): void {
    this.data[name] = value;
  }
};

Object.defineProperty(Room.prototype, 'cache', {
  configurable: true,
  get: function(): RoomCache {
    return global.roomCache.get(this.name) as RoomCache;
  },
  set: function(value: RoomCache): void {
    global.roomCache.set(this.name, value);
  }
});
