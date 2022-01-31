// this file defines the global object "CreepManager"
// this file should be imported when the script is loaded
// CreepManager has several methods that will be called by creeps or by main process every tick

import BuildConfigList from './config/configMain.js';

global.CreepManager = {
    confList: [],
    confTable: {},

    GetLogic(confName) {
        // return null if configName does not exist
        let conf = this.confTable[confName];
        if (conf == null) {
            console.log(`[ERROR] CreepManager GetLogic fail with name ${confName}`);
            return null;
        }
        return {role: conf.role, args: conf.args};
    },

    RunUpdate() {
        // globally called every tick before creeps work
        this.confList = BuildConfigList();

        let tmpRequire = Memory.creepTmpRequire;
        // console.log(`[DEBUG] CreepManager RunUpdate: ${JSON.stringify(tmpRequire)}`);
        if (tmpRequire) {
            let appear = {};
            for (let conf of this.confList) {
                if (tmpRequire[conf.name] != null) {
                    let tmp = tmpRequire[conf.name];
                    if (tmp <= 0) {
                        delete tmpRequire[conf.name];
                        continue;
                    }
                    conf.require = Infinity;
                    appear[conf.name] = true;
                }
            }
            for (let name in tmpRequire) {
                if (!appear[name]) {
                    delete tmpRequire[name];  // 移除无效项
                }
            }
        }

        this.confTable = {};
        for (let conf of this.confList) {
            this.confTable[conf.name] = conf;
        }
    },

    AddTmpRequire(confName, require = 1) {
        if (!Memory.creepTmpRequire) Memory.creepTmpRequire = {};
        if (Memory.creepTmpRequire[confName] == null) {
            Memory.creepTmpRequire[confName] = 0;
        }
        Memory.creepTmpRequire[confName] += require;
        if (Memory.creepTmpRequire[confName] <= 0) {
            delete Memory.creepTmpRequire[confName];
        }
    },

    RunSpawn() {
        let used = {};
        for (let conf of this.confList) {
            let liveThreshold = (conf.liveThreshold || 0) + 3 * conf.body.length;
            let numExist = _.filter(Game.creeps, (creep) => {
                return creep.memory.configName == conf.name && (creep.ticksToLive > liveThreshold || creep.spawning);
            }).length;
            if (numExist >= conf.require) continue;

            // need to spawn this
            let allowedSpawns = conf.spawn;
            if (!Array.isArray(conf.spawn)) {
                allowedSpawns = [allowedSpawns];
            }

            let succ = false;
            for (let spawnName of allowedSpawns) {
                if (used[spawnName]) continue;
                let spawn = Game.spawns[spawnName];
                if (spawn == null) {
                    console.log(`[ERROR] CreepManager spawn ${spawnName} not found`);
                    continue;
                }
                if (spawn.spawning) {
                    used[spawnName] = true;
                    continue;
                }

                let result = spawn.spawnCreep(conf.body, conf.name + '_' + Game.time, {
                    memory: {
                        configName: conf.name
                    }
                });

                if (result == OK) {
                    // successful
                    succ = true;
                    used[spawnName] = true;
                    // remove tmp require
                    this.AddTmpRequire(conf.name, -1);
                    break;
                } else if (result == ERR_NOT_ENOUGH_ENERGY) {
                    // block this spawn
                    used[spawnName] = true;
                }
            }
        }
    }
};