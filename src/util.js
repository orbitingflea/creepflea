import utilConstant from './util.constant.js';

export default {
    getObjectType: function(obj) {
        if (!obj) {
            return 'null';
        }
        var str = obj.toString();
        if (str.indexOf("[creep ") == 0) {
            return 'creep';
        }
        var l = 1, r = str.indexOf(' #');
        if (str[0] == '[' && r != -1) {
            return str.substring(l, r);
        } else {
            return 'unknown';
        }
    },

    getStructureIdListMayNeedEnergy: function(room) {
        return room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER ||
                        structure.structureType == STRUCTURE_LAB);
            }
        }).map((obj) => obj.id);
    },

    myRoom: function() {
        return Game.rooms['E38S45'];
    },

    myRoom2: function() {
        return Game.rooms['E39S45'];
    },

    parkPosition: function() {
        return this.myRoom().getPositionAt(17, 33);
    },

    parkPosition2() {
        return this.myRoom2().getPositionAt(30, 22);
    },

    tryToSpawnCreep: function(spawn, body, name, memory) {
        var res = spawn.spawnCreep(body, name, {
            memory: memory
        });
        return res == 0;
    },

    closestObjectWithTopPriority: function(targetList, priorityFunction, pos) {
        var targetListSorted = _.sortBy(targetList, priorityFunction).reverse();
        const n = targetListSorted.length;
        for (var i = 0; i < n; ) {
            var j = i + 1;
            while (j < n && priorityFunction(targetListSorted[j]) == priorityFunction(targetListSorted[i])) {
                j++;
            }
            var closest = pos.findClosestByPath(targetListSorted.slice(i, j));
            if (closest) {
                return closest;
            }
            i = j;
        }
        return null;
    },

    closestTaskWithTopPriority: function(taskList, pos) {
        var tasks = _.sortBy(taskList, (task) => (task.priority)).reverse();
        const n = tasks.length;
        for (var i = 0; i < n; ) {
            var j = i + 1;
            while (j < n && tasks[i].priority == tasks[j].priority) {
                j++;
            }
            var closest = pos.findClosestByPath(tasks.slice(i, j).map((task) => Game.getObjectById(task.targetId)),
                { range: 3 });
            if (closest) {
                // find in the same room
                for (var k = i; k < j; k++) {
                    if (tasks[k].targetId == closest.id) {
                        return tasks[k];
                    }
                }
                console.log('runtime error');
                return null;
            } else {
                // if exist in other room
                for (var k = i; k < j; k++) {
                    const obj = Game.getObjectById(tasks[k].targetId);
                    if (!obj || obj.room.name != pos.roomName) {
                        return tasks[k];
                    }
                }
            }
            i = j;
        }
        return null;
    },

    getCreepCost: function(body) {
        var cost = 0;
        for (var i = 0; i < body.length; i++) {
            cost += BODYPART_COST[body[i]];
        }
        return cost;
    },

    constant: utilConstant,

    resourceTypeList: utilConstant.resourceTypeList,
};

export function BodyWCM(nWork, nCarry, nMove) {
    var body = [];
    for (var i = 0; i < nWork; i++) body.push(WORK);
    for (var i = 0; i < nCarry; i++) body.push(CARRY);
    for (var i = 0; i < nMove; i++) body.push(MOVE);
    return body;
}

export function BodyRepeat(parts) {
    let body = [];
    for (let info of parts) {
        let type = info.type, num = info.num;
        for (let i = 0; i < num; i++) body.push(type);
    }
    return body;
}

export function GetCreepCost(body) {
    let cost = 0;
    for (let i = 0; i < body.length; i++) {
        cost += BODYPART_COST[body[i]];
    }
    return cost;
}
