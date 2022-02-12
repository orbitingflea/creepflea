import { getRepairerTasks } from 'modules/repair/main';

export default {
    GetWorkerTasks: function(room, upgrade=true) {
        var taskList = [];

        // build structures
        taskList = taskList.concat(room.constructionSites.map((obj) => ({
            targetId: obj.id,
            action: 'build',
            priority: 100
        })));

        // repair everything
        taskList = taskList.concat(getRepairerTasks(room));

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
        return getRepairerTasks(room);
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
