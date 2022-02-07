// This file is to be removed soon.
import { Rectangle } from 'lib/rectangle';

function GetCollapseTime(obj) {
    let eff = obj.effects;
    // console.log(`[DEBUG] obj = ${obj}`);
    if (eff == null) return -1;
    for (let e of eff) {
        if (e.effect == EFFECT_COLLAPSE_TIMER) {
            return e.ticksRemaining;
        }
    }
    return -1;
}

/**
 * global.roomDanger, defined by ts service 'dangerInfo'
 */
export function RoomDanger(roomName) {
    let danger = roomDanger(roomName);
    if (danger === null) {
        Memory.rooms[roomName]._spawnedDefender = false;
        return null;
    } else {
        if (danger.type !== 'stronghold' && !Memory.rooms[roomName]._spawnedDefender) {
            Memory.rooms[roomName]._spawnedDefender = true;
            CreepManager.AddTmpRequire('OuterDefender_' + roomName, 1);
        }
        return danger;
    }
}



export function GetStrongholdContainers(room) {
    return room.functionalStructures.filter(
        s => (structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0 && GetCollapseTime(structure) >= 0)
    ).map((obj) => obj.id);
}


/**
 * must be called when visible
 * 返回一个 LAIR 潜在的危险区域的矩形
 */
export function GetDangerZone(lair) {
    if (lair.cache.dangerZone) return lair.cache.dangerZone;
    let dangerZone = lair.room.lairRegions.find(r => r.shape.contains(lair.pos));
    lair.cache.dangerZone = dangerZone.shape;
    return lair.cache.dangerZone;
}

export function IsDangerZoneActive(lair) {
    let dangerZone = lair.room.lairRegions.find(r => r.shape.contains(lair.pos));
    return dangerZone.active;
}
