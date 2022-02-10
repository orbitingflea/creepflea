import util from 'util.js';
import creepCommon from 'creep.common.js';

export default (args) => ({
    // args: {sourceId, controllerId}

    prepare: null,

    source: creepCommon.sourceById(args.sourceId),

    target: creep => {
        const controller = Game.getObjectById(args.controllerId);
        if (creep.store[RESOURCE_ENERGY] == 0) {
            return true;
        }
        if (creep.pos.inRangeTo(controller, 3)) {
            creep.upgradeController(controller);
        } else {
            creep.moveTo(controller, {visualizePathStyle: {stroke: '#ffffff', range: 3}});
        }
        return false;
    }
});
