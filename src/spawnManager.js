/**
 * 本文件定义了除 CreepManager 之外第二种生成 Creep 的方式，用任务队列来管理，先进先出。
 * 每个房间有一个 spawn 队列。
 * 
 * 未启用
 */

class SpawnManager {
    constructor() {
        this.taskList = [];
        this.spawnName = [];
        this.roomName = '';
    }

    get json() {
        return {
            taskList: this.taskList
        };
    }

    set json(v) {
        this.taskList = v.taskList;
    }

    init(roomName) {
        this.roomName = roomName;
        this.spawnName = _.filter(Game.spawns, spawn => spawn.room.name == roomName);

    }
}