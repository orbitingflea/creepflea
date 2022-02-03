import { Rectangle } from './movement/rectangle.js';

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
        if (danger.type === 'invader' && !Memory.rooms[roomName]._spawnedDefender) {
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
    let sources = lair.pos.findInRange(FIND_SOURCES, 5).concat(lair.pos.findInRange(FIND_MINERALS, 5));
    if (sources.length !== 1) {
        console.log(`[ERROR] lair ${lair.name} has ${sources.length} sources`);
    }

    let xl = lair.pos.x, xr = lair.pos.x, yl = lair.pos.y, yr = lair.pos.y;
    for (let source of sources) {
        xl = Math.min(xl, source.pos.x);
        xr = Math.max(xr, source.pos.x);
        yl = Math.min(yl, source.pos.y);
        yr = Math.max(yr, source.pos.y);
    }
    const dangerRange = 4;
    xl = Math.max(0, xl - dangerRange);
    xr = Math.min(49, xr + dangerRange);
    yl = Math.max(0, yl - dangerRange);
    yr = Math.min(49, yr + dangerRange);

    let dangerZone = new Rectangle(xl, xr, yl, yr, lair.room.name);
    lair.cache.dangerZone = dangerZone;
    return dangerZone;
}

export function IsDangerZoneActive(lair) {
    if (lair.cache.safeEndTime) {
        if (Game.time < lair.cache.safeEndTime) {
            return false;
        }
        delete lair.cache.safeEndTime;
    }

    if (lair.cache.keeperId) {
        let keeper = Game.getObjectById(lair.cache.keeperId);
        if (keeper) {
            return true;
        }
        delete lair.cache.keeperId;
    }

    const PREJUDGE_TIME = 15;
    if (lair.ticksToSpawn != null && lair.ticksToSpawn <= PREJUDGE_TIME) {
        return true;
    }

    let keepers = lair.pos.findInRange(FIND_HOSTILE_CREEPS, 5, {
        filter: creep => creep.owner.username === 'Source Keeper'
    });
    if (keepers.length > 0) {
        lair.cache.keeperId = keepers[0].id;
        return true;
    }

    // safe
    lair.cache.safeEndTime = Game.time + lair.ticksToSpawn - PREJUDGE_TIME;
    return false;
}
