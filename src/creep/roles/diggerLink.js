import util from '@/util.js';
import creepCommon from '@/creep.common.js';

export default (args) => ({
    // args: {sourceId, linkId, roomName, workingPosition}

    prepare: creepCommon.prepareGotoPosition(new RoomPosition(...args.workingPosition, args.roomName)),

    source: creep => {
        const source = Game.getObjectById(args.sourceId);
        let predictedGain = Math.min(source.energy, creep.getActiveBodyparts(WORK) * 2);
        if (creep.store[RESOURCE_ENERGY] + predictedGain > creep.store.getCapacity()) {
            return true;
        }

        // if exist dropped resource, pickup
        let resList = creep.pos.lookFor(LOOK_RESOURCES, {filter: r => r.resourceType == RESOURCE_ENERGY});
        if (resList.length > 0) {
            creep.pickup(resList[0]);
            return false;
        }

        // use container if exist
        const containers = creep.pos.lookFor(LOOK_STRUCTURES, {filter: s => s.structureType == STRUCTURE_CONTAINER});
        let container;
        if (containers.length > 0) container = containers[0];
        if (container && creep.store[RESOURCE_ENERGY] + container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
            creep.withdraw(container, RESOURCE_ENERGY);
            return false;
        }

        if (source.energy > 0) {
            creep.harvest(source);
            return false;
        }

        return true;
    },

    target: creep => {
        const link = Game.getObjectById(args.linkId);
        if (link.store[RESOURCE_ENERGY] == link.store.getCapacity(RESOURCE_ENERGY) || creep.store[RESOURCE_ENERGY] == 0) {
            return true;
        }
        creep.transfer(link, RESOURCE_ENERGY);
        return false;
    },

    wait: creep => {
        const source = Game.getObjectById(args.sourceId);
        creep.harvest(source);
    }
});
