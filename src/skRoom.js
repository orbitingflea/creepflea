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
 * room.memory.danger = {
 *   ids: [ list of id that makes dangerous ]
 *   ticksToEnd: number
 * }
 */
export function RoomDanger(roomName) {
    let room = Game.rooms[roomName];
    let mem = Memory.rooms[roomName];
    if (!mem) {
        Memory.rooms[roomName] = {};
        mem = Memory.rooms[roomName];
    }
    if (!room) {
        if (mem.danger && Game.time >= mem.danger.endTime) {
            mem.danger = null;
        }
        return mem.danger;
    }

    if (room.dangerComputed) {
        return mem.danger;
    }
    room.dangerComputed = true;

    let ids = [];
    let ticksToEnd = -1;
    let creepList = room.find(FIND_CREEPS);
    for (let creep of creepList) {
        if (creep.spawning) continue;
        if (creep.owner.username === 'Invader') {
            ids.push(creep.id);
            ticksToEnd = Math.max(ticksToEnd, creep.ticksToLive);
        }
    }
    let structureList = room.find(FIND_HOSTILE_STRUCTURES);
    for (let structure of structureList) {
        if (structure.structureType === STRUCTURE_TOWER) {
            ids.push(structure.id);
            ticksToEnd = Math.max(ticksToEnd, GetCollapseTime(structure));
        }
    }

    if (ticksToEnd === -1) {
        mem.danger = null;
    } else {
        let spawnedDefender = false;
        if (mem.danger) {
            spawnedDefender = mem.danger.spawnedDefender;
        }
        if (!spawnedDefender) {
            CreepManager.AddTmpRequire('OuterDefender_' + roomName, 1);
            spawnedDefender = true;
        }
        mem.danger = {
            ids: ids,
            endTime: Game.time + ticksToEnd,
            spawnedDefender: spawnedDefender,
        };
    }
    return mem.danger;
}



export function GetStrongholdContainers(room) {
    return room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0 &&
                GetCollapseTime(structure) >= 0);
        }
    }).map((obj) => obj.id);
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