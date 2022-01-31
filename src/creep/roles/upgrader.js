import util from 'util.js';
import creepCommon from 'creep.common.js';

export default (args) => ({
    // args: {containerId, controllerId}

    prepare: creepCommon.prepareGotoObject(args.containerId),

    source: creep => {
        const container = Game.getObjectById(args.containerId);
        if (creep.store[RESOURCE_ENERGY] == creep.store.getCapacity() ||
            creep.store[RESOURCE_ENERGY] > 0 && container.store[RESOURCE_ENERGY] == 0) {
            return true;
        }
        creep.withdraw(container, RESOURCE_ENERGY);
        return false;
    },

    target: creep => {
        const controller = Game.getObjectById(args.controllerId);
        if (creep.store[RESOURCE_ENERGY] == 0) {
            return true;
        }
        creep.upgradeController(controller);
        return false;
    }
});
