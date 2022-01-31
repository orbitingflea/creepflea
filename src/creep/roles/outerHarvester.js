import util from 'util.js';
import creepCommon from 'creep.common.js';

const defaultEarlyStop = 500;

export default (args) => ({
    // args: {sourceId, targetId}
    // optional: sourceRoom, earlyStop

    source: creep => {
        let source = Game.getObjectById(args.sourceId);
        let predictedGain = (source && source.energy != null ?
            Math.min(source.energy, creep.getActiveBodyparts(WORK) * 2) : creep.getActiveBodyparts(WORK));
        let earlyStop = args.earlyStop != null ? args.earlyStop : defaultEarlyStop;
        if (creep.store.getUsedCapacity() + predictedGain > creep.store.getCapacity() || creep.ticksToLive < earlyStop) {
            return true;
        }

        if (source && creep.pos.inRangeTo(source, 1)) {
            creep.harvest(source);
        } else {
            creep.driveToBlindObject(source, args.sourceRoom, {range: 1});
        }
        return false;
    },

    target: creep => {
        if (creep.store.getUsedCapacity() == 0) {
            let earlyStop = args.earlyStop != null ? args.earlyStop : defaultEarlyStop;
            if (creep.ticksToLive < earlyStop) {
                creep.suicide();
                return false;
            }
            return true;
        }
        const target = Game.getObjectById(args.targetId);
        if (creep.pos.inRangeTo(target, 1)) {
            for (let resourceType in creep.store) {
                creep.transfer(target, resourceType);
            }
        } else {
            creep.driveTo(target, {range: 1});
        }
        return false;
    },
});
