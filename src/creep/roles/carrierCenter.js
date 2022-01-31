/**
 * 中央转运 Carrier
 * 平时自己发布任务，自己做，不经过 CarrierManager：把 center link 和 source container（如果有）中的能量搬运给 storage
 * 如果手头没事干，也可以去 CarrierManager 处接任务，filter 设置为自己够得着的
 */

import util from '@/util.js';
import creepCommon from '@/creep.common.js';
import { CarrierTask } from '@/carrierManager.js';

export default (args) => ({
    // args.storageId, args.linkId, args.terminalId, ?args.containerId
    // move from containerId and linkId to storageId

    prepare: creepCommon.prepareGotoPositionXY(args.workingPosition),

    source: creep => {
        let workingPosition = new RoomPosition(...args.workingPosition, creep.room.name);
        if (!creep.pos.isEqualTo(workingPosition)) {
            console.log(`[WARN] Center Carrier ${creep.name} is not at working position ${JSON.stringify(args.workingPosition)}`);
            creep.driveTo(workingPosition, {range: 0});
            return false;
        }
        if (creep.memory.currentTask) {
            let task = new CarrierTask(creep.memory.currentTask);
            task.workBy(creep);
            return false;
        }

        // ----------

        let storage = Game.getObjectById(args.storageId);
        if (!storage) {
            console.log(`[WARN] Center Carrier ${creep.name} cannot find storage ${args.storageId}`);
            return false;
        }
        if (creep.store.getUsedCapacity() > 0) {
            for (let resourceType in creep.store) {
                creep.transfer(storage, resourceType);
                return false;
            }
        }

        let capacity = creep.store.getCapacity();
        if (args.linkId) {
            let link = Game.getObjectById(args.linkId);
            if (link && link.store[RESOURCE_ENERGY] > 0) {
                let task = new CarrierTask({
                    fromId: args.linkId,
                    toId: args.storageId,
                    resourceType: RESOURCE_ENERGY,
                    amount: capacity,
                });
                task.workBy(creep);
                return false;
            }
        }

        if (args.containerId) {
            let container = Game.getObjectById(args.containerId);
            if (container && container.store[RESOURCE_ENERGY] >= capacity) {
                let task = new CarrierTask({
                    fromId: args.containerId,
                    toId: args.storageId,
                    resourceType: RESOURCE_ENERGY,
                    amount: capacity,
                });
                task.workBy(creep);
                return false;
            }
        }

        // ----------
        // get task from manager

        let task = CarrierManager(creep.room.name).GetSlice(capacity, (task) => {
            let fromObj = Game.getObjectById(task.fromId);
            let toObj = Game.getObjectById(task.toId);
            return fromObj && toObj && creep.pos.inRangeTo(fromObj, 1) && creep.pos.inRangeTo(toObj, 1);
        });
        if (task) {
            task.workBy(creep);
            return false;
        }

        return false;
    },

    target: creep => {
        return true;
    },

    wait: null,
});
