/**
 * 本文件描述的是外矿挖掘者的工作逻辑
 * args: {roomName, workingPosition, sourceId, retreatRoom}
 * 可以在没有视野的情况下寻路前往工作地点
 * 有工作模式和撤退模式
 * 
 * workingPosition 上可以有一个 container，也可以没有，资源会丢在地上
 */

import util from '@/util.js';
import creepCommon from '@/creep.common.js';
import { RoomDanger, GetDangerZone, IsDangerZoneActive } from '@/skRoom.js';

// const skSafeRange = 5;
const skWaitRange = 7;
// const prejudgeTime = 15;

function Retreat(creep, roomName) {
    let target = new RoomPosition(25, 25, roomName);
    if (!creep.pos.inRangeTo(target, 20) || !creep.pos.parkable) {
        creep.driveTo(target, {range: 20, offRoad: true});
    }
}


// 已弃用
export function GetDanger(pos) {
    if (!pos.visible) return null;
    let lair = pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR
    });
    if (!lair) return null;
    if (IsDangerZoneActive(lair)) {
        let rect = GetDangerZone(lair);
        return rect;
    }
    return null;
}



export default (args) => ({
    // args: {roomName, workingPosition, sourceId, retreatRoom}

    prepare: null,

    source: creep => {
        // ----------
        // 大撤退

        const room = Game.rooms[args.roomName];
        if (RoomDanger(args.roomName)) {
            creep.memory.retreat = true;
            Retreat(creep, args.retreatRoom);
            return false;
        } else {
            creep.memory.retreat = false;
        }

        // ----------
        // 小撤退

        let rect = GetDanger(creep.pos);
        let workingPosition = new RoomPosition(...args.workingPosition, args.roomName);
        if (rect && rect.contains(creep.pos)) {
            if (creep.pos.isEqualTo(workingPosition) && creep.store[RESOURCE_ENERGY] > 0) {
                creep.drop(RESOURCE_ENERGY);
            }
            creep.driveTo(workingPosition, {range: skWaitRange, offRoad: true, dangerZone: rect});
            return false;
        }

        // ----------
        // 前进

        if (rect && rect.contains(workingPosition)) {
            creep.driveTo(workingPosition, {range: skWaitRange, offRoad: true, dangerZone: rect});
            return false;
        }
        if (!creep.pos.isEqualTo(workingPosition)) {
            creep.driveTo(workingPosition, {range: 0});
            return false;
        }

        // ----------
        // 工作

        const source = Game.getObjectById(args.sourceId);
        const containers = room.lookForAt(LOOK_STRUCTURES, creep.pos).filter(s => s.structureType == STRUCTURE_CONTAINER);
        let container;
        if (containers.length > 0) container = containers[0];
        if (container && container.hits < container.hitsMax && creep.store[RESOURCE_ENERGY] >= creep.getActiveBodyparts(WORK)) {
            creep.repair(container);
            return false;
        }
        const sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos).filter(s => s.structureType == STRUCTURE_CONTAINER);
        if (sites.length > 0 && creep.store[RESOURCE_ENERGY] >= creep.getActiveBodyparts(WORK) * 5) {
            creep.build(sites[0]);
            return false;
        }

        // ----------
        // 开始采集能量

        // 将周围格子的掉落物放在这个格子上
        let threshold = 50;
        let full = !container || container.store.getFreeCapacity() == 0;
        let drops = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
            filter: r => r.resourceType == RESOURCE_ENERGY && r.amount > threshold && !(full && r.pos.isEqualTo(creep.pos))
        });
        if (drops.length > 0) {
            if (creep.store.getFreeCapacity() == 0) {
                creep.drop(RESOURCE_ENERGY);
                return false;
            } else {
                creep.pickup(drops[0]);
                return false;
            }
        }

        // 搜索墓碑
        let tombstones = creep.pos.findInRange(FIND_TOMBSTONES, 1, {
            filter: t => t.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });
        if (tombstones.length > 0) {
            if (creep.store.getFreeCapacity() == 0) {
                creep.drop(RESOURCE_ENERGY);
                return false;
            } else {
                creep.withdraw(tombstones[0], RESOURCE_ENERGY);
                return false;
            }
        }

        creep.harvest(source);
        return false;
    },

    target: creep => {
        return true;
    },
});
