/**
 * 带有 ATTACK 部件，击退入侵者集群
 * 永不撤退，死了算了
 * 索敌时优先没有 ATTACK 的
 */

import { RoomDanger } from '../../skRoom';

function ExecuteAction(creep) {
    while (creep.memory.action) {
        let action = creep.memory.action;
        creep.say(action.work);
        let work = FunctionManager.get(action.work);
        if (work && work(creep, action.args)) {
            return true;
        } else {
            creep.memory.action = action.next;
        }
    }
    return false;
}



const moveToRoom = FunctionManager.register((creep, roomName) => {
    if (creep.room.name === roomName) {
        return false;
    } else {
        if (creep.hits < creep.hitsMax) creep.heal(creep);
        creep.driveTo(new RoomPosition(25, 25, roomName), {range: 20});
        return true;
    }
}, 'moveToRoom');



const moveToCenter = FunctionManager.register((creep, roomName) => {
    let center = new RoomPosition(25, 25, roomName);
    if (creep.pos.matchDestination(center, {range: 3}) && !creep.pos.inActiveLairRegion) {
        return false;
    } else {
        if (creep.hits < creep.hitsMax) creep.heal(creep);
        creep.driveAvoidLair(center, {range: 3});
        return true;
    }
}, 'moveToCenter');



const waitUntilDanger = FunctionManager.register((creep, roomName) => {
    if (RoomDanger(roomName)) return false;
    return true;
}, 'waitUntilDanger');



const attackTarget = FunctionManager.register((creep, targetId) => {
    let target = Game.getObjectById(targetId);
    if (!target) return false;
    if (target.pos.inActiveLairRegion) return false;
    if (creep.pos.isNearTo(target)) {
        creep.attack(target);
        creep.move(creep.pos.getDirectionTo(target));
        return true;
    }
    let hostileNearMe = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {
        filter: creep => !creep.inWhiteList()
    });
    if (hostileNearMe.length > 0) {
        creep.attack(hostileNearMe[0]);
    } else if (creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }
    creep.driveAvoidLair(target, {range: 1});
    return true;
}, 'attackTarget');



export default args => ({
    // args: {roomName}
    source: creep => {
        if (ExecuteAction(creep)) return false;
        if (creep.room.name !== args.roomName) {
            creep.memory.action = {
                work: moveToRoom,
                args: args.roomName,
            };
            ExecuteAction(creep);
            return false;
        }
        // 索敌
        let hostileCreeps = creep.room.findHostileCreeps();
        if (hostileCreeps.length > 0) {
            let candidates = hostileCreeps.filter(c => c.getActiveBodyparts(ATTACK) === 0);
            let target;
            if (candidates.length > 0) {
                target = creep.pos.findClosestByRange(candidates);
            } else {
                target = creep.pos.findClosestByRange(hostileCreeps);
            }
            if (!target) {
                console.log(`[WARN] impossible branch, skDefender`);
                target = hostileCreeps[0];
            }

            if (target.pos.inActiveLairRegion) {
                // move to center
                creep.memory.action = {
                    work: moveToCenter,
                    args: args.roomName,
                };
            } else {
                creep.memory.action = {
                    work: attackTarget,
                    args: target.id,
                };
            }
            ExecuteAction(creep);
            return false;
        }
        // 没有敌人，搜索敌对 Tower
        let towers = creep.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });
        if (towers.length > 0) {
            creep.memory.action = {
                work: attackTarget,
                args: creep.pos.findClosestByRange(towers).id,
            };
            ExecuteAction(creep);
            return false;
        }
        // 去房间中央等待
        if (RoomDanger(args.roomName)) {
            console.log(`[ERROR] skDefender impossible branch: RoomDanger`);
            return false;
        }
        creep.memory.action = {
            work: moveToCenter,
            args: args.roomName,
            next: {
                work: waitUntilDanger,
                args: args.roomName,
            }
        };
        ExecuteAction(creep);
        return false;
    },
    target: creep => {
        return false;
    }
});
