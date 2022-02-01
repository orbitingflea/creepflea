/**
 * 本文件实现了 Creep.cache，并挂在到 hook 上实现垃圾回收。
 */

global.creepCache = {
  data: {},
  get: function(id: Id<Creep>): Object | null {
    if (!(id in this.data)) {
      this.data[id] = {};
    }
    return this.data[id];
  },
  set: function(id: Id<Creep>, value: Object): void {
    this.data[id] = value;
  }
};

Object.defineProperty(Creep.prototype, 'cache', {
  configurable: true,
  get: function(): CreepCache {
    return global.creepCache.get(this.id) as CreepCache;
  },
  set: function(value: CreepCache): void {
    global.creepCache.set(this.id, value);
  }
});

global.tickEndHook.push(function(): void {
  if (Game.cpu.getUsed() < 19) {
    for (const id in global.creepCache.data) {
      if (Game.getObjectById(id as Id<Creep>) === undefined) {
        delete global.creepCache.data[id];
      }
    }
  }
});
