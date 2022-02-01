import creepCommon from 'creep.common.js';

function carrierTargetPriority(obj) {
    if (obj.structureType) {
        // is a structure
        if (obj.store[RESOURCE_ENERGY] == obj.store.getCapacity(RESOURCE_ENERGY)) {
            return -1;
        }
        switch (obj.structureType) {
            case STRUCTURE_EXTENSION:
                return 100;
            case STRUCTURE_SPAWN:
                return 100;
            case STRUCTURE_TOWER:
                return 105;
            case STRUCTURE_CONTAINER:
                return 55;
            case STRUCTURE_STORAGE:
                return 10;  // least priority
            case STRUCTURE_LAB:
                return 20;
            case STRUCTURE_POWER_SPAWN:
                return 18;
            case STRUCTURE_NUKER:
                return 19;
            default:
                return -1;
        }
    } else {
        // is a creep
        if (obj.store[RESOURCE_ENERGY] < obj.store.getCapacity() * 0.6) {
            return 50;
        }
        return -1;
    }
}

export default (args) => ({
    // args.sourceId, args.targetIdList

    source: creep => {
        creep.memory.currentTargetId = null;
        return creepCommon.sourceById(args.sourceId)(creep);
    },

    target: creep => {
        if (creep.store[RESOURCE_ENERGY] == 0) {
            delete creep.memory.currentTargetId;
            return true;
        }
        const targetList = args.targetIdList.map(id => Game.getObjectById(id)).filter(obj => obj && carrierTargetPriority(obj) >= 0);
        if (targetList.length == 0) return true;

        let target;
        if (creep.memory.currentTargetId) {
            if (targetList.find(obj => obj.id == creep.memory.currentTargetId)) {
                target = Game.getObjectById(creep.memory.currentTargetId);
                // console.log(`[DEBUG] reuse target: creep ${creep.name} reuse target ${target}`);
            }
        }
        if (!target) {
            target = creep.pos.findClosestByRange(targetList);
            if (!target) target = targetList[0];
            creep.memory.currentTargetId = target.id;
        }

        if (!creep.pos.inRangeTo(target, 1)) {
            creep.driveTo(target, {range: 1});
            return false;
        }

        if (creep.transfer(target, RESOURCE_ENERGY) == OK) {
            let nextTarget;
            if (creep.store[RESOURCE_ENERGY] > target.store.getFreeCapacity(RESOURCE_ENERGY)) {
                // 如果这个填满了，就寻找下一个
                nextTarget = creep.pos.findClosestByRange(targetList, {
                    filter: obj => obj.id != target.id
                });
            } else {
                // 如果这个没有填满，就寻找 source
                nextTarget = Game.getObjectById(args.sourceId);
            }

            // find next target
            if (nextTarget) {
                creep.memory.currentTargetId = nextTarget.id;
                creep.driveTo(nextTarget, {range: 1});
            }
        }
        return false;
    },

    wait: creepCommon.waitOffRoad(),
});
