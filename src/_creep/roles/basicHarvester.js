import util from 'util.js';
import creepCommon from 'creep.common.js';

const defaultEarlyStop = 300;

export default (args) => ({
    // args: {sourceId, targetId}
    // optional: sourceRoom, earlyStop

    prepare: creepCommon.prepareGotoRoom('E40S45'),

    source: creep => {
        let source = Game.getObjectById(args.sourceId);
        let predictedGain = (source && source.energy != null ?
            Math.min(source.energy, creep.getActiveBodyparts(WORK) * 2) : creep.getActiveBodyparts(WORK));
        let earlyStop = args.earlyStop != null ? args.earlyStop : defaultEarlyStop;
        if (creep.store.getUsedCapacity() + predictedGain > creep.store.getCapacity() || creep.ticksToLive < earlyStop) {
            return true;
        }
        if (!source) {
            creep.moveTo(new RoomPosition(25, 25, args.sourceRoom), {visualizePathStyle: {stroke: '#ffaa00', range: 10}});
            return false;
        }
        if (creep.pos.inRangeTo(source, 1)) {
            creep.harvest(source);
        } else {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00', range: 1, reusePath: 50}});
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
            creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff', range: 1, reusePath: 50}});
        }
        return false;
    },
});
