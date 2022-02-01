import { Rectangle } from './rectangle.js';
import { GetDangerZone } from '../skRoom.js';

function AddPenalty(room, costs, x, y, delta) {
    if (!room.getPositionAt(x, y).isWall) {
        costs.set(x, y, Math.min(costs.get(x, y) + delta, 255));
    }
}

/**
 * 静态 callback，将道路代价标记为 roadCost，不可通行静止结构标记为 255
 * 可以很有效地缓存，减少 room.find 次数
 * 计算成本巨大
 * 适用于大部分有道路可走的 creep，它们实际上不用看见别人也能很好地寻路
 */
export const staticCallback = (roadCost = 1) => (roomName) => {
    let cacheName = `staticCallback${roomName}${roadCost}`;
    let cache = staticCache.get(cacheName, 1000);  // 静态信息可以用很久
    if (cache) return cache;

    const room = Game.rooms[roomName];
    let costs = new PathFinder.CostMatrix;
    if (!room) {
        cache = staticCache.get(cacheName, Infinity);
        if (cache) return cache;
        else return costs;
    }

    console.log(`[INFO] recalc static callback for ${roomName}, roadCost=${roadCost}`);

    // ----------
    // 开始计算

    let structureList = room.find(FIND_STRUCTURES).concat(room.find(FIND_CONSTRUCTION_SITES));

    for (let structure of structureList) {
        if (structure.structureType === STRUCTURE_ROAD) {
            costs.set(structure.pos.x, structure.pos.y, roadCost);
        } else if (structure.structureType === STRUCTURE_CONTAINER ||
                (structure.structureType === STRUCTURE_RAMPART && structure.my)) {
        } else {
            costs.set(structure.pos.x, structure.pos.y, 255);
        }

        // SK penalty
        // const skPenalty = 50;
        // if (structure.structureType === STRUCTURE_KEEPER_LAIR) {
        //     let rect = GetDangerZone(structure);
        //     let points = rect.getBoundary();
        //     for (let pos of points) {
        //         AddPenalty(room, costs, pos.x, pos.y, skPenalty);
        //     }
        // }
    }

    staticCache.set(cacheName, costs);
    return costs;
}



/**
 * 因为耐心耗尽而重新寻路的时候使用的 callback
 * 如果 roadBlocking 模式启用，则将道路上的 creep 视为障碍，否则视为可以通行
 */
export const creepCallback = (roadBlocking = false) => (roomName) => {
    let cacheName = `creepCallback${roomName}${roadBlocking}`;
    let cache = staticCache.get(cacheName, 1);
    if (cache) return cache;

    const room = Game.rooms[roomName];
    if (!room) return staticCallback(1)(roomName);
    let costs = staticCallback(1)(roomName).clone();

    console.log(`[INFO] calc creep callback for ${roomName}, roadBlocking=${roadBlocking}`);

    const creepList = room.find(FIND_CREEPS);
    for (let creep of creepList) {
        if (creep.spawning) continue;
        if (!creep.pos.isRoad || !creep.my || roadBlocking) {
            costs.set(creep.pos.x, creep.pos.y, 255);
        }
    }

    staticCache.set(cacheName, costs);
    return costs;
}



// 需要通过 SK 房间的士兵，无视道路，用最传统的方法寻路
export const skSoldierCallback = (blocking) => (roomName) => {
    const room = Game.rooms[roomName];
    if (!room || blocking == 0) return staticCallback(2)(roomName);

    let cacheName = `skSoldierCallback${roomName}`;
    let cache = staticCache.get(cacheName, 1);
    if (cache) return cache;

    let costs = staticCallback(2)(roomName).clone();
    console.log(`[INFO] calc soldier callback for ${roomName}`);

    const creepList = room.find(FIND_CREEPS);
    for (let creep of creepList) {
        if (creep.spawning) continue;
        costs.set(creep.pos.x, creep.pos.y, 255);
    }

    staticCache.set(cacheName, costs);
    return costs;
}


// --------------------
// 后处理

/**
 * 单房间的 Callback，在规避 SK 的时候调用。dangerZone 是一个矩形。
 * WARN：调用前 creep 必须处于危险区域的外面，否则就出不去了。
 * @param {Rectangle} dangerZone
 * @param {RoomCallback} callback
 * @param {string} roomName1
 * @returns
 */
export const banDangerZone = (dangerZone, callback, roomName1) => (roomName2) => {
    if (roomName1 !== roomName2) return callback(roomName2);
    let costs = callback(roomName1).clone();
    let points = dangerZone.getBoundary();
    for (let pos of points) {
        costs.set(pos.x, pos.y, 255);
    }
    return costs;
}
