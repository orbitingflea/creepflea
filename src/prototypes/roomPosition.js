
/**
 * RoomPosition.terrain
 * 返回地形，结果是
 * - 0: plain
 * - 1 == TERRAIN_MASK_WALL: wall
 * - 2 == TERRAIN_MASK_SWAMP: swamp
 * 该方法不需要视野
 */
Object.defineProperty(RoomPosition.prototype, 'terrain', {
    configurable: true,
    get: function() {
        return Game.map.getRoomTerrain(this.roomName).get(this.x, this.y);
    }
});



// 已弃用
Object.defineProperty(RoomPosition.prototype, 'json', {
    configurable: true,
    get: function() {
        return {
            x: this.x,
            y: this.y,
            roomName: this.roomName
        };
    }
});



/**
 * RoomPosition.walkable
 * 就静态物来说是否能够行走
 * 如果没有视野，仅仅判断地形；否则扫描该点的所有 structures 和 construction sites
 */
Object.defineProperty(RoomPosition.prototype, 'walkable', {
    configurable: true,
    get: function() {
        if (this.terrain == TERRAIN_MASK_WALL) return false;
        if (!this.visible) return true;

        if (this.lookFor(LOOK_STRUCTURES).filter(
            (structure) =>
                (structure.structureType !== STRUCTURE_ROAD &&
                structure.structureType !== STRUCTURE_CONTAINER &&
                (structure.structureType !== STRUCTURE_RAMPART ||
                !structure.my))
        ).length > 0) return false;

        if (this.lookFor(LOOK_CONSTRUCTION_SITES).filter(
            (site) =>
                (site.structureType !== STRUCTURE_ROAD &&
                site.structureType !== STRUCTURE_CONTAINER &&
                (site.structureType !== STRUCTURE_RAMPART ||
                !site.my))
        ).length > 0) return false;
        return true;
    }
});



/**
 * RoomPosition.parkable
 * 与 walkable 类似，但进一步判断是否适宜停车
 * 不要停在道路上，或者白色旗帜的位置
 * 但如果是黄色旗帜，则可以停车
 */
Object.defineProperty(RoomPosition.prototype, 'parkable', {
    configurable: true,
    get: function() {
        if (this.terrain == TERRAIN_MASK_WALL) return false;
        if (!this.visible) return true;
        if (this.isEdge) return false;

        let flags = this.lookFor(LOOK_FLAGS);
        if (flags.find(flag => flag.color === COLOR_YELLOW)) return true;
        if (this.lookFor(LOOK_STRUCTURES).length > 0) return false;
        if (this.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) return false;
        if (flags.find(flag => flag.color == COLOR_WHITE)) return false;

        return true;
    }
});



/**
 * 一些功能性函数
 */
Object.defineProperty(RoomPosition.prototype, 'visible', {
    configurable: true,
    get: function() {
        return !!Game.rooms[this.roomName];
    }
});

Object.defineProperty(RoomPosition.prototype, 'isWall', {
    configurable: true,
    get: function() {
        return this.terrain == TERRAIN_MASK_WALL;
    }
});

Object.defineProperty(RoomPosition.prototype, 'isEdge', {
    configurable: true,
    get: function() {
        return this.x == 0 || this.x == 49 || this.y == 0 || this.y == 49;
    }
});

Object.defineProperty(RoomPosition.prototype, 'underCreep', {
    configurable: true,
    get: function() {
        return this.visible &&
            (this.lookFor(LOOK_CREEPS).length > 0 ||
            this.lookFor(LOOK_POWER_CREEPS).length > 0);
    }
});

Object.defineProperty(RoomPosition.prototype, 'isRoad', {
    configurable: true,
    get: function() {
        return this.visible && this.lookFor(LOOK_STRUCTURES)
            .concat(this.lookFor(LOOK_CONSTRUCTION_SITES))
            .filter((structure) => structure.structureType == STRUCTURE_ROAD)
            .length > 0;
    }
});



RoomPosition.prototype.getLairRegion = function() {
    if (!this.visible) return null;
    let lair = this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
    });
    if (!lair) return null;
    return lair.dangerZone;
}



RoomPosition.prototype.getActiveLairRegion = function() {
    if (!this.visible) return null;
    let lair = this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
    });
    if (!lair || !lair.isDangerZoneActive) return null;
    return lair.dangerZone;
}



Object.defineProperty(RoomPosition.prototype, 'inActiveLairRegion', {
    configurable: true,
    get: function() {
        if (!this.visible) return false;
        let lair = this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
        });
        if (!lair || !lair.isDangerZoneActive) return false;
        return lair.dangerZone.contains(this);
    }
});