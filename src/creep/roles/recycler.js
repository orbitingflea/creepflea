import util from '@/util.js';
import creepCommon from '@/creep.common.js';
import { CarrierTask } from '@/carrierManager.js';

function RunExtraTask(creep) {
    let task = new CarrierTask(creep.memory.currentTask);
    task.workBy(creep);
}

const runTaskThreshold = 200;

export default (args) => ({
    // args = {targetId, sourceIdList}
    // optional: roomName
    // collect dropped energy or tombstone's energy

    source: creep => {
        // blocked by CarrierManager
        if (creep.memory.currentTask) {
            RunExtraTask(creep);
            return false;
        }

        if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {
            return true;
        }

        var sourceList = args.sourceIdList.map((id) => Game.getObjectById(id));
        if (sourceList.length == 0) {
            return true;
        }

        var source = creep.pos.findClosestByPath(sourceList, {range: 1});
        if (!source) {
            source = sourceList[0];
            // maybe no in same room, cannot find by findClosestByPath
        }

        if (!creep.pos.inRangeTo(source, 1)) {
            if (creep.store.getUsedCapacity() >= creep.store.getCapacity() * 0.8) {
                // almost full, move to target
                return true;
            }
            creep.driveTo(source, {range: 1});
            return false;
        }

        var result = creep.pickup(source);
        if (result == ERR_INVALID_TARGET) {
            // target need withdraw method
            const types = util.resourceTypeList;
            for (var i = types.length - 1; i >= 0; i--) {
                var type = types[i];
                if (source.store[type] > 0) {
                    creep.withdraw(source, type);
                    return false;
                }
            }
        }
        return false;
    },

    target: creep => {
        if (creep.store.getUsedCapacity() == 0) {
            return true;
        }
        const target = Game.getObjectById(args.targetId);
        if (!creep.pos.inRangeTo(target, 1)) {
            creep.driveTo(target, {range: 1});
            return false;
        }
        const types = util.resourceTypeList;
        for (var i = 0; i < types.length; i++) {
            var type = types[i];
            if (creep.store[type] > 0) {
                creep.transfer(target, type);
                return false;
            }
        }
        return false;
    },

    wait: creep => {
        // first see whether creep.room contains CarrierTask
        let roomName = args.roomName ? args.roomName : Game.getObjectById(args.targetId).room.name;
        if (creep.ticksToLive < runTaskThreshold) {
            creep.park();
            return;
        }
        let task = CarrierManager(roomName).GetSlice(creep.store.getCapacity());
        if (task) {
            task.workBy(creep);
            return;
        }
        creep.park();
    }
});
