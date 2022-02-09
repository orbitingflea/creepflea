// OuterAttacker：拥有 Attack，用来拆掉 NPC 的建筑

import util from 'util.js';
import creepCommon from 'creep.common.js';

export default (args) => ({
    // {roomName}
    prepare: args.roomName ? creepCommon.prepareGotoRoom(args.roomName) : null,
    source: creep => {
        return true;
    },

    target: creep => {
        const room = args.roomName ? Game.rooms[args.roomName] : creep.room;

        // if there exist hostile creeps in the room, attack them
        let hostileCreeps = room.hostileCreeps;
        if (hostileCreeps.length) {
            let target = creep.pos.findClosestByPath(hostileCreeps);
            if (!target) target = hostileCreeps[0];
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.driveTo(target, {range: 1});
                return false;
            }
            creep.attack(target);
            return false;
        }

        // if there is hostile structures, attack it
        let hostileStructures = room.find(FIND_HOSTILE_STRUCTURES, {
            filter: structure => structure.structureType !== STRUCTURE_KEEPER_LAIR
        });
        if (hostileStructures.length) {
            let target = creep.pos.findClosestByPath(hostileStructures);
            if (!target) target = hostileStructures[0];
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
