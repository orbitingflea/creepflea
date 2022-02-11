/**
 * 本文件定义全局对象 creepManager，用于管理 creep 的工作参数和运行 spawn 过程。
 * [TMP] 暂时为了向下兼容，import 了旧的 config 文件，以后会逐步替代。
 */

import buildOldConfigList from '_creep/config/configMain.js';
import buildConfigList from 'creep/config/main';
import { ensureArray } from 'lib/utils';

const UPDATE_TIME_THRESHOLD = 10;

function generateConfigWork(preset: CreepConfigPreset) {
  return {
    role: preset.role,
    args: preset.args instanceof Function ? preset.args() : preset.args,
  };
}

function translateOldConfig(conf: any): CreepConfigPreset {
  return {
    name: conf.name,
    role: conf.role,
    body: conf.body,
    require: conf.require,
    spawn: ensureArray(conf.spawn),
    liveThreshold: conf.liveThreshold || 0,
    args: conf.args
  };
}

global.creepManager = {
  confList: [],
  confMap: {},
  tickHook: [],

  getConfigWork(confName: string): CreepConfigWork | null {
    if (this.confMap[confName]) {
      let item = this.confMap[confName];
      if (item.lastUpdateTime < Game.time) {
        item.data = generateConfigWork(item.preset);
        item.lastUpdateTime = Game.time;
      }
      return item.data;
    }
    return null;
  },

  runUpdate() {
    if (this._lastDeepUpdateTime === undefined || Game.time - this._lastDeepUpdateTime >= UPDATE_TIME_THRESHOLD) {
      this._lastDeepUpdateTime = Game.time;
      let oldList = buildOldConfigList() as CreepConfig[];
      let [confList, actions] = buildConfigList();
      this.confList = confList.concat(oldList.map(conf => translateOldConfig(conf)));
      this.tickHook = actions;
      this.confMap = {};
      for (let conf of this.confList) {
        this.confMap[conf.name] = {
          preset: conf,
          lastUpdateTime: Game.time,
          data: generateConfigWork(conf)
        };
      }
    } else {
      let oldList = buildOldConfigList() as CreepConfig[];
      for (let conf of oldList) {
        if (!this.confMap[conf.name]) {
          this.confMap[conf.name] = {
            preset: conf,
            lastUpdateTime: Game.time,
            data: {
              role: conf.role,
              args: conf.args
            }
          };
        } else {
          this.confMap[conf.name].data = {
            role: conf.role,
            args: conf.args
          }
        }
      }
    }

    for (let f of this.tickHook) {
      f();
    }
  },

  addTmpRequire(name: string, number: number = 1): number {
    if (!this.confMap[name]) {
      console.log(`[WARN] creepManager.addTmpRequire: ${name} not found.`);
      return ERR_INVALID_ARGS;
    }
    if (!Memory.creepTmpRequire) Memory.creepTmpRequire = {};
    if (Memory.creepTmpRequire[name] === undefined) {
      Memory.creepTmpRequire[name] = 0;
    }
    Memory.creepTmpRequire[name] += number;
    if (Memory.creepTmpRequire[name] <= 0) {
      delete Memory.creepTmpRequire[name];
    }
    return OK;
  },

  runSpawn() {
    let roomUsed: {[name: string]: boolean} = {};
    let myCreeps = _.groupBy(Game.creeps, (creep) => creep.memory.configName);

    for (let conf of this.confList) {
      let liveThreshold = conf.liveThreshold + 3 * conf.body.length;
      let numExist = _.filter(myCreeps[conf.name], (creep) =>
        (creep.ticksToLive && creep.ticksToLive > liveThreshold || creep.spawning)
      ).length;
      let numRequire = Memory.creepTmpRequire && Memory.creepTmpRequire[conf.name] ? Infinity :
        conf.require instanceof Function ? conf.require() : conf.require;
      if (numExist >= numRequire) continue;

      // need to spawn this type of creep
      let succ = false;
      for (let spawnName of conf.spawn) {
        let spawn = Game.spawns[spawnName];
        if (!spawn) {
          console.log(`[ERROR] creepManager.runSpawn: spawn ${spawnName} not found.`);
          continue;
        }
        if (spawn.spawning || roomUsed[spawn.room.name]) continue;
        let ret = spawn.spawnCreep(conf.body, conf.name + '_' + Game.time, {
          memory: {
            configName: conf.name
          }
        });
        if (ret === OK) {
          succ = true;
          roomUsed[spawn.room.name] = true;
          this.addTmpRequire(conf.name, -1);
          break;
        } else if (ret === ERR_NOT_ENOUGH_ENERGY) {
          roomUsed[spawn.room.name] = true;
        }
      }
    }
  }
}
