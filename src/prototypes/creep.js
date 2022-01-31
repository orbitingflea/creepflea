import { InWhiteList } from '@/util.js';

Creep.prototype.park = function() {
    if (!this.pos.parkable) {
        let pos = new RoomPosition(25, 25, this.room.name);
        this.driveTo(pos, {
            range: 25,
            offRoad: true
        });
    }
};

Creep.prototype.moveOffRoad = Creep.prototype.park;  // 已弃用

Creep.prototype.isOffRoad = function() {
    return this.pos.parkable;
};

Creep.prototype.isStrictInRoom = function(roomName) {
    return this.room.name == roomName && !(creep.pos.x == 0 || creep.pos.y == 0 || creep.pos.x == 49 || creep.pos.y == 49);
};

Creep.prototype.inWhiteList = function() {
    return InWhiteList(this);
};

Creep.prototype.repairRoad = function() {
    if (this.store[RESOURCE_ENERGY] > 0 && this.getActiveBodyparts(WORK) > 0) {
        const roads = this.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType == STRUCTURE_ROAD && s.hits < s.hitsMax);
        if (roads.length > 0) this.repair(roads[0]);
        const road_sites = this.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(s => s.structureType == STRUCTURE_ROAD);
        if (road_sites.length > 0) this.build(road_sites[0]);
    }
};

Object.defineProperty(Creep.prototype, 'cache', {
    configurable: true,
    get: function() {
        let cacheName = `creepCache${this.id}`;
        let cache = CacheMind.get(cacheName, Infinity);
        if (!cache) {
            cache = {};
            CacheMind.set(cacheName, cache);
        }
        return cache;
    },
    set: function(cache) {
        let cacheName = `creepCache${this.id}`;
        CacheMind.set(cacheName, cache);
    }
});


Creep.prototype.collectEnergyOrDrop = function() {
    // 优先捡起 dropped resource
    let dropped = this.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
        filter: d => d.resourceType == RESOURCE_ENERGY
    });
    if (dropped.length > 0) {
        let target = dropped[0];
        if (this.store.getFreeCapacity() == 0) {
            this.drop(RESOURCE_ENERGY);
            return true;
        }
        this.pickup(target);
        return true;
    }

    // 捡起墓碑
    let tombstones = this.pos.findInRange(FIND_TOMBSTONES, 1, {
        filter: t => t.store[RESOURCE_ENERGY] > 0
    });
    if (tombstones.length > 0) {
        let target = tombstones[0];
        if (this.store.getFreeCapacity() == 0) {
            this.drop(RESOURCE_ENERGY);
            return true;
        }
        this.withdraw(target, RESOURCE_ENERGY);
        return true;
    }

    return false;
}