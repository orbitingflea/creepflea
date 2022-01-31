import './core.js';
import { staticCallback } from './callback.js';
import { GetDangerZone, IsDangerZoneActive } from 'skRoom.js';

Creep.prototype.driveToBlindObject = function(object, roomName, opts) {
    if (opts.range == null) opts.range = 1;
    if (object) {
        if (this.pos.inRangeTo(object, opts.range) && (!opts.offRoad || this.pos.parkable)) return false;
        this.driveTo(object, opts);
        return false;
    }
    // blind case: if memory has path
    if (this.memory.driveInfo) {
        if (this.driveStep()) return true;
    }
    // blind case: if no memory
    return this.driveTo(new RoomPosition(25, 25, roomName), {range: 20});
}

RoomPosition.prototype.FindClosestByPath = function(posList) {
    return this.findClosestByPath(posList, {
        // algorithm: 'dijkstra',
        plainCost: 2,
        swampCost: 10,
        costCallback: function(roomName, costMatrix) {
            return staticCallback()(roomName);
        }
    });
}


// 已弃用
Creep.prototype.moveOffRoadNearObject = function(object, range, opts = {}) {
    if (!object || !object.room || range == null || range < 0) return -1;
    let targetPosList = [];
    const xl = Math.max(object.pos.x - range, 1);
    const xr = Math.min(object.pos.x + range, 48);
    const yl = Math.max(object.pos.y - range, 1);
    const yr = Math.min(object.pos.y + range, 48);
    for (let y = yl; y <= yr; y++) {
        for (let x = xl; x <= xr; x++) {
            const pos = new RoomPosition(x, y, this.room.name);
            if (pos.parkable && (!pos.underCreep || pos.isEqualTo(this.pos))) {
                targetPosList.push(pos);
            }
        }
    }
    if (targetPosList.length == 0) return -1;
    let targetPos = this.pos.FindClosestByPath(targetPosList);
    if (false) {
        console.log(`[DEBUG] creepName: ${this.name}; targetPosList: ${JSON.stringify(targetPosList)}; target: ${JSON.stringify(targetPos)}`);
    }
    if (targetPos) {
        this.driveTo(targetPos, {range: 0});
        return 0;
    }
    return -1;
}


Creep.prototype.driveAvoidLair = function(destination, opts = {}) {
    let lair = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_KEEPER_LAIR
    });
    if (lair && IsDangerZoneActive(lair)) {
        let rect = GetDangerZone(lair);
        opts.dangerZone = rect;
    }
    this.driveTo(destination, opts);
}
