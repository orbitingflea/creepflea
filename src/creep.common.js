import util from 'util.js';

export default {
    // 定义若干常用的方法

    waitOffRoad: () => (creep) => {
        const res = creep.moveOffRoad();
    },

    prepareGotoPositionXY: (posXY) => (creep) => {
        const pos = creep.room.getPositionAt(...posXY);
        if (!creep.pos.isEqualTo(pos)) {
            creep.driveTo(pos, {range: 0});
            return false;
        }
        return true;
    },

    prepareGotoPosition: (pos) => (creep) => {
        if (!creep.pos.isEqualTo(pos)) {
            creep.driveTo(pos, {range: 0});
            return false;
        }
        return true;
    },

    prepareGotoObject: (id) => (creep) => {
        const obj = Game.getObjectById(id);
        if (!creep.pos.inRangeTo(obj.pos, 0)) {
            creep.driveTo(obj, {range: 0});
            return false;
        }
        return true;
    },

    prepareGotoObjectInRange: (id, range) => (creep) => {
        const obj = Game.getObjectById(id);
        if (!creep.pos.inRangeTo(obj.pos, range)) {
            creep.driveTo(obj, {range: range});
            return false;
        }
        return true;
    },

    prepareGotoRoom: (roomName) => (creep) => {
        if (creep.room.name != roomName) {
            creep.driveTo(new RoomPosition(25, 25, roomName), {range: 10});
            return false;
        }
        return true;
    },

    prepareGotoBlindObject: (id, roomName, range = 1) => (creep) => {
        let obj = Game.getObjectById(id);
        if (obj && creep.pos.inRangeTo(obj.pos, range)) return true;
        creep.driveToBlindObject(Game.getObjectById(id), roomName, {range: range});
        return false;
    },

    prepareGetBoosted: (boostTypeList) => (creep) => {
        /**
         * boostTypeList 的每个元素形如 {heal: 'XLHO2'}
         * 当 creep 还有指定的 bodypart 没强化，则寻找含有目标 resourceType 的 lab，并强化。
         * 如果找不到，报个 WARN，然后就算了。
         */
        const labList = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_LAB &&
                structure.store[structure.mineralType] >= 30 &&
                structure.store[RESOURCE_ENERGY] >= 20
        });
        let skip = false;
        for (let part of creep.body) {
            if (boostTypeList[part.type] != null && part.boost == null) {
                let lab = labList.find(lab => lab.mineralType === boostTypeList[part.type]);
                if (lab) {
                    if (!creep.pos.inRangeTo(lab, 1)) {
                        creep.driveTo(lab, {range: 1});
                    } else {
                        lab.boostCreep(creep);
                    }
                    return false;
                } else {
                    skip = true;
                }
            }
        }
        if (skip) {
            console.log(`[WARN] Lab 资源不足，${creep.name} 没有完全强化`);
        }
        return true;
    },

    // ----------
    // source method

    /**
     * 从指定 id 的位置取 energy
     * 仅适用于 id 一定可见的情形
     */
    sourceById: sourceId => creep => {
        const source = Game.getObjectById(sourceId);
        const type = util.getObjectType(source);
        if (creep.store.getUsedCapacity() == creep.store.getCapacity() ||
            (type == 'source' && source.energy == 0)) {
            return true;
        }
        if (creep.pos.inRangeTo(source, 1)) {
            if (type == 'source') {
                creep.harvest(source);
            } else if (type.indexOf('resource') != -1) {
                creep.pickup(source);
            } else {
                creep.withdraw(source, RESOURCE_ENERGY);
            }
        } else {
            creep.driveTo(source, {range: 1});
        }
        return false;
    },
};
