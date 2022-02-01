// OuterDefender：拥有 Attack, Heal，可以抵御侵略小组的攻击。可以保护

import util from 'util.js';
import creepCommon from 'creep.common.js';
import { skSoldierCallback } from 'movement/callback';

export default (args) => ({
    // {roomName}
    prepare: args.roomName ? creepCommon.prepareGotoRoom(args.roomName) : null,
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
                range: 20
            });
            return false;
        }

        // if there exist hostile creeps in the room, attack them
        let hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !creep.inWhiteList;
            }
        });
        if (hostileCreeps.length) {
            let target = creep.pos.findClosestByPath(hostileCreeps);
            if (!target) target = hostileCreeps[0];
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.driveTo(target, {range: 1});
                creep.heal(creep);
                return false;
            }
            // check whether heal or attack
            if (creep.hits + creep.getActiveBodyparts(HEAL) * HEAL_POWER < creep.hitsMax) {
                creep.heal(creep);
            } else {
                creep.attack(target);
            }
            return false;
        }

        // if there exist healthless creeps in the room, heal them
        let healCreeps = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return creep.hits < creep.hitsMax;
            }
        });
        if (healCreeps.length) {
            let target = creep.pos.findClosestByPath(healCreeps);
            if (!target) target = healCreeps[0];
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.driveTo(target, {range: 1});
                return false;
            }
            creep.heal(target);
            return false;
        }

        // if there is invader core, attack it
        let invaderCore = room.find(FIND_HOSTILE_STRUCTURES);
        if (invaderCore.length) {
            let target = creep.pos.findClosestByPath(invaderCore);
            if (!target) target = invaderCore[0];
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.driveTo(target, {range: 1});
                return false;
            }
            creep.attack(target);
            return false;
        }

        return true;
    },

    wait: creepCommon.waitOffRoad(),
});
