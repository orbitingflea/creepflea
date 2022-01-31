// Screeps
// this file defines the class "CarrierManager" and a global object "CarrierManager(name)"
// this file should be imported when the script is loaded

// the class CarrierManager is not exported, but a global function CarrierManager(roomName) can be used to get an instance

export class CarrierTask {
    constructor(v = null) {
        if (v) {
            this.json = v;
        }
    }

    get json() {
        return {
            fromId: this.fromId,
            toId: this.toId,
            resourceType: this.resourceType,
            amount: this.amount
        };
    }

    set json(v) {
        this.fromId = v.fromId;
        this.toId = v.toId;
        this.resourceType = v.resourceType;
        this.amount = v.amount;
    }

    isValid() {
        let obj = Game.getObjectById(this.fromId);
        if (!obj || !obj.store || this.amount <= 0) {
            return false;
        }
        if (obj.store[this.resourceType] == 0) {
            return false;
        }
        return true;
    }

    workBy(creep) {
        // console.log(JSON.stringify(this.json));
        // return finish or not
        if (creep.memory.currentTask == null) {
            if (creep.store.getUsedCapacity() != 0) {
                creep.say('ERR');
                console.log(`ERROR: ${creep.name} has non-empty store.`);
                return false;
            }
            creep.memory.currentTask = this.json;
            creep.memory.currentTaskStatus = 0;
        }
        if (creep.memory.currentTaskStatus == 0) {
            let obj = Game.getObjectById(this.fromId);
            if (obj.store[this.resourceType] == 0) {
                creep.memory.currentTask = null;
                creep.memory.currentTaskStatus = null;
                return true;
            }
            if (!creep.pos.inRangeTo(obj, 1)) {
                creep.driveTo(obj);
                return false;
            }
            creep.withdraw(obj, this.resourceType, Math.min(this.amount, obj.store[this.resourceType]));
            creep.memory.currentTaskStatus = 1;
            return false;
        }
        if (creep.memory.currentTaskStatus == 1) {
            let obj = Game.getObjectById(this.toId);
            if (!creep.pos.inRangeTo(obj, 1)) {
                creep.driveTo(obj);
                return false;
            }
            creep.transfer(obj, this.resourceType);
            creep.memory.currentTask = null;
            creep.memory.currentTaskStatus = null;
            return true;
        }
        console.log(`ERR impossible branch in CarrierTask.workBy()`);
    }
};

class CarrierManager {
    constructor() {
        this.taskList = [];
    }

    get json() {
        return {
            taskList: this.taskList.map(v => v.json)
        };
    }

    set json(v) {
        this.taskList = v.taskList.map(v => new CarrierTask(v));
    }

    Update() {
        // update all tasks
        for (let i = 0; i < this.taskList.length; i++) {
            let task = this.taskList[i];
            if (task.isValid()) {
                continue;
            }
            this.taskList.splice(i, 1);
            i--;
        }
    }

    NewTask(fromId, toId, resourceType, amount = Infinity) {
        this.Update();

        // verify if this request is valid
        let from = Game.getObjectById(fromId);
        let to = Game.getObjectById(toId);
        if (!from || !to || !from.store || !to.store || from.store[resourceType] == 0) {
            return 'Invalid NewTask request.';
        }

        for (let i = 0; i < this.taskList.length; i++) {
            if (this.taskList[i].fromId == fromId && this.taskList[i].toId == toId && this.taskList[i].resourceType == resourceType) {
                this.taskList[i].amount += amount;
                return `Merged into exist task: ${from} -> ${to}, ${this.taskList[i].amount} ${resourceType}.`;
            }
        }
        this.taskList.push(new CarrierTask({
            fromId: fromId,
            toId: toId,
            resourceType: resourceType,
            amount: amount
        }));
        return `Added new task: ${from} -> ${to}, ${amount} ${resourceType}.`;
    }

    GetSlice(capacity, filter = null) {
        // get any slice of task to perform
        for (let i = 0; i < this.taskList.length; i++) {
            let task = this.taskList[i];
            if (!task.isValid()) {
                this.taskList.splice(i, 1);
                i--;
                continue;
            }
            if (filter && !filter(task)) {
                continue;
            }
            let amount = Math.min(task.amount, capacity);
            // let foo = task.amount;
            task.amount -= amount;
            // console.log(`[DEBUG] Task amount ${foo} -> ${task.amount}`);
            return new CarrierTask({
                fromId: task.fromId,
                toId: task.toId,
                resourceType: task.resourceType,
                amount: amount
            });
        }
        return null;
    }

    ShowTasks() {
        let str = '';
        for (let i = 0; i < this.taskList.length; i++) {
            let task = this.taskList[i];
            str = str.concat(`${task.fromId} -> ${task.toId} ${task.resourceType} ${task.amount}\n`);
        }
        return str;
    }

    RemoveAllTask() {
        this.taskList = [];
    }
}

global.CarrierManagerTable = {};

global.CarrierManager = function(roomName) {
    if (!Memory.CarrierManager) {
        Memory.CarrierManager = {};
    }
    if (!CarrierManagerTable[roomName]) {
        CarrierManagerTable[roomName] = new CarrierManager();
        if (Memory.CarrierManager[roomName] != null) {
            CarrierManagerTable[roomName].json = Memory.CarrierManager[roomName];
        }
    }
    return CarrierManagerTable[roomName];
}

export function CarrierManagerSave() {
    if (!Memory.CarrierManager) {
        Memory.CarrierManager = {};
    }
    for (let name in CarrierManagerTable) {
        CarrierManagerTable[name].Update();
        Memory.CarrierManager[name] = CarrierManagerTable[name].json;
    }
}

function GetAlias(roomName, str) {
    if (str === 'storage') {
        return Game.rooms[roomName].storage.id;
    }
    if (str === 'factory') {
        return Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_FACTORY
        })[0].id;
    }
    if (str === 'terminal') {
        return Game.rooms[roomName].terminal.id;
    }
    return str;
}

function GetResourceTypeAlias(resourceType) {
    // if is string
    if (resourceType.toLowerCase() === 'allbutenergy') {
        let res = RESOURCES_ALL;
        res.splice(res.indexOf(RESOURCE_ENERGY), 1);
        return res;
    } else if (resourceType.toLowerCase() === 'all') {
        return RESOURCES_ALL;
    } else if (typeof resourceType === 'string') {
        return [resourceType];
    } else if (Array.isArray(resourceType)) {
        return resourceType;
    } else {
        return null;
    }
}

// for console usage
global.NewCarrierTask = function(roomName, from, to, resourceType, amount = Infinity) {
    let fromId = GetAlias(roomName, from);
    let toId = GetAlias(roomName, to);
    let fromObj = Game.getObjectById(fromId);
    let toObj = Game.getObjectById(toId);
    if (!fromObj || !toObj) {
        return 'Invalid object.';
    }

    let restype = GetResourceTypeAlias(resourceType);
    if (!restype) {
        return 'Unknown resource type.';
    }

    let output = '';
    let manager = global.CarrierManager(roomName);
    for (let type of restype) {
        output = output + manager.NewTask(fromId, toId, type, amount) + '\n';
    }
    return output;
}