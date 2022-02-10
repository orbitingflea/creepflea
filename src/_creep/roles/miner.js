import util from 'util.js';
import creepCommon from 'creep.common.js';

export default (args) => ({
    // args = {sourceId, containerId}
    prepare: creepCommon.prepareGotoObject(args.containerId),

    source: creep => {
        const source = Game.getObjectById(args.sourceId);
        let container = Game.getObjectById(args.containerId);
        if (container && container.store.getFreeCapacity() > 0) {
            creep.harvest(source);
        }
        return false;
    },

    target: creep => {
        return true;
    }
});
