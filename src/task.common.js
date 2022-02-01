import util from 'util.js';

export default {
    GetWorkerTasks: function(room, upgrade=true) {
        var taskList = [];

        // build structures
        taskList = taskList.concat(room.constructionSites.map((obj) => ({
            targetId: obj.id,
            action: 'build',
            priority: 100
        })));

        // repair ramparts
        taskList = taskList.concat(room.structures.filter(
            (structure) => {
                return ((structure.structureType === STRUCTURE_RAMPART && structure.my ||
                         structure.structureType === STRUCTURE_WALL) && structure.hits < util.constant.hitsMaxRampart);
            }
        ).map((obj) => ({
            targetId: obj.id,
            action: 'repair',
            priority: 50
        })));

        // upgrade controller
        if (upgrade) {
            taskList.push({
                targetId: room.controller.id,
                action: 'upgrade',
                priority: 1
            });
        }

        return taskList;
    },

    GetRepairerTasks: function(room) {
        var taskList = room.structures.filter(
            (s) => {
                if ('my' in s && !s.my) return false;
                if (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART)
                    return structure.hits < util.constant.hitsMaxRampart;
                return s.hits < s.hitsMax - 1000;
            }
        ).map((obj) => ({
            targetId: obj.id,
            action: 'repair',
            priority: 120
        }));

        return taskList;
    },

    GetRecyclerTargets: function(room) {
        const droppedList = room.find(FIND_DROPPED_RESOURCES, {
            filter: (obj) => {
                return (obj.amount >= 100 || obj.resourceType != RESOURCE_ENERGY);
            }
        });
        const tombList = room.find(FIND_TOMBSTONES, {
            filter: (tomb) => {
                return tomb.store.getUsedCapacity() > 0;
            }
        });
        const ruinList = room.find(FIND_RUINS, {
            filter: (ruin) => {
                return ruin.store.getUsedCapacity() > 0;
            }
        });
        return droppedList.concat(tombList).concat(ruinList).map((obj) => obj.id);
    }
};
