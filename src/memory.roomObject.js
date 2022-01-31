Object.defineProperty(RoomObject.prototype, 'memory', {
    get: function() {
        if (!Memory.roomObjects) {
            Memory.roomObjects = {};
        }
        if (!Memory.roomObjects[this.id]) {
            Memory.roomObjects[this.id] = {};
        }
        return Memory.roomObjects[this.id];
    },
    set: function(value) {
        if (!Memory.roomObjects) {
            Memory.roomObjects = {};
        }
        if (!Memory.roomObjects[this.id]) {
            Memory.roomObjects[this.id] = {};
        }
        Memory.roomObjects[this.id] = value;
    },
    configurable: true
});

export function CleanUp() {
    for (let id in Memory.roomObjects) {
        if (!Game.getObjectById(id)) {
            delete Memory.roomObjects[id];
        }
    }
};