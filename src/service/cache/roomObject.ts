/**
 * 本文件实现了 RoomObject.cache，并挂在到 hook 上实现垃圾回收。
 */

global.roomObjectCache = {
  data: {},
  get: function(id: Id<RoomObject>): Object {
    if (!(id in this.data)) {
      this.data[id] = {};
    }
    return this.data[id];
  },
  set: function(id: Id<RoomObject>, value: Object): void {
    this.data[id] = value;
  }
};

Object.defineProperty(RoomObject.prototype, 'cache', {
  configurable: true,
  get: function(): RoomObjectCache {
    return global.roomObjectCache.get(this.id) as RoomObjectCache;
  },
  set: function(value: RoomObjectCache): void {
    global.roomObjectCache.set(this.id, value);
  }
});

Object.defineProperty(RoomObject.prototype, 'hasCache', {
  get: function(): boolean {
    return this.id in global.roomObjectCache.data;
  }
});

// 猜想：RoomObject 相对比较固定，不会出现消失的情况，很少需要回收内存。
// global.tickEndHook.push(function(): void {
//   if (Game.cpu.getUsed() < 19) {
//     for (const id in global.roomObjectCache.data) {
//       if (Game.getObjectById(id as Id<RoomObject>) === undefined) {
//         delete global.roomObjectCache.data[id];
//       }
//     }
//   }
// });
