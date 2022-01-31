/**
 * 攻城狮，攻击 roomName 中的要塞
 */

import util from 'util.js';
import creepCommon from 'creep.common.js';
import { skSoldierCallback } from 'movement/callback';

export default (args) => ({
    // {roomName}
    prepare: creepCommon.prepareGetBoosted({tough: 'XGHO2', heal: 'XLHO2', ranged_attack: 'XKHO2'}),
    source: creep => {
        return true;
    },

    target: creep => {
        const room = args.roomName ? Game.rooms[args.roomName] : creep.room;
        if (!room) {
            if (!!creep.memory.driveInfo) {
                if (creep.driveStep()) return false;
            }
            creep.driveTo(new RoomPosition(25, 25, args.roomName), {
                range: 20,
                roomCallback: skSoldierCallback()
            });
            return false;
        }

        let hostileCreeps;
        let target;
        if (creep.memory.target) {
            target = Game.getObjectById(creep.memory.target);
            if (!target) creep.memory.target = null;
        }

        if (creep.room.name != args.roomName) {
            // 还没到，不要索敌
            creep.driveTo(new RoomPosition(25, 25, args.roomName), {
                range: 20,
                roomCallback: skSoldierCallback()
            });
            return false;
        }

        if (!creep.memory.target) {
            hostileCreeps = room.findHostileCreeps();
            if (hostileCreeps.length > 0) {
                target = creep.pos.findClosestByRange(hostileCreeps);
                creep.memory.target = target.id;
            }
        }

        if (!creep.memory.target) {
            let hostileStructures = room.find(FIND_HOSTILE_STRUCTURES, {
                filter: structure => structure.structureType !== STRUCTURE_KEEPER_LAIR
            });
            if (hostileStructures.length > 0) {
                let towers = hostileStructures.filter(structure => structure.structureType === STRUCTURE_TOWER);
                if (towers.length > 0) {
                    target = creep.pos.findClosestByRange(towers);
                    creep.memory.target = target.id;
                } else {
                    target = creep.pos.findClosestByRange(hostileStructures);
                    creep.memory.target = target.id;
                }
            }
        }

        if (!creep.memory.target) {
            hostileCreeps = room.findSourceKeepers();
            if (hostileCreeps.length > 0) {
                target = creep.pos.findClosestByPath(hostileCreeps);
                creep.memory.target = target.id;
            }
        }

        // ----------
        // 已索敌，冲上去打
        if (target) {
            creep.heal(creep);
            if (creep.pos.inRangeTo(target, 3)) {
                creep.rangedAttack(target);
                return false;
            } else {
                creep.driveTo(target, {range: 3, offRoad: true, roomCallback: skSoldierCallback()});
                return false;
            }
        }

        // ----------
        // 治疗除去自身的单位

        let healCreeps = room.find(FIND_MY_CREEPS, {
            filter: (c) => {
                return c.hits < c.hitsMax && c.id !== creep.id;
            }
        });
        if (healCreeps.length) {
            let target = creep.pos.findClosestByRange(healCreeps);
            if (!target) target = healCreeps[0];
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.driveTo(target, {range: 1, roomCallback: skSoldierCallback()});
                if (creep.hits < creep.hitsMax) creep.heal(creep);
                return false;
            }
            creep.heal(target);
            return false;
        }

        creep.park();
        return false;
    }
});
