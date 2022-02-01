Object.defineProperty(RoomObject.prototype, 'memory', {
  configurable: true,
  get: function(): RoomObjectMemory {
    if (!(this.id in Memory.roomObjects)) {
      Memory.roomObjects[this.id] = {};
    }
    return Memory.roomObjects[this.id];
  },
  set: function(value: RoomObjectMemory) {
    Memory.roomObjects[this.id] = value;
  }
});

Object.defineProperty(RoomObject.prototype, 'hasMemory', {
  get: function(): boolean {
    return this.id in Memory.roomObjects;
  }
});

Object.defineProperty(StructureSpawn.prototype, 'hasMemory', {
  get: function(): boolean {
    return true;
  }
});

// execute directly
if (!Memory.roomObjects) {
  Memory.roomObjects = {};
}

// garbage collection
global.tickEndHook.push(function(): void {
  if (Game.time % 100 === 0) {
    for (let key in Memory.roomObjects) {
      if (!Game.getObjectById(key as Id<RoomObject>) || _.isEqual(Memory.roomObjects[key], {})) {
        delete Memory.roomObjects[key];
      }
    }
  }
});
