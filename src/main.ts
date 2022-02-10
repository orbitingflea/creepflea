import { ErrorMapper } from 'utils/ErrorMapper';

import profiler from 'screeps-profiler';

import './functionManager.js';  // must import early

import util from 'util.js';
import roleTower from 'role.tower.js';

import MarketMain from 'market.js';
import { CarrierManagerSave } from 'carrierManager.js';

const LOG_CPU_INFO = 0;

import 'init';

function runHook(hook: (() => void)[]) {
  for (const func of hook) {
    func();
  }
}

profiler.enable();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  profiler.wrap(() => {
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }

    runHook(global.tickBeginHook);

    let cpustart = Game.cpu.getUsed();
    if (LOG_CPU_INFO) {
        console.log(`[CPU-INFO] Init: ${cpustart}`);
    }

    creepManager.runUpdate();

    if (LOG_CPU_INFO) {
        console.log(`[CPU-INFO] creepManager.runUpdate: ${Game.cpu.getUsed() - cpustart}`);
        cpustart = Game.cpu.getUsed();
    }

    // 让所有 creep 执行他们的角色
    for (let name in Game.creeps) {
      let creep = Game.creeps[name];
      if (creep.spawning) continue;
      if (creep.memory.configName) {
        let workStart = Game.cpu.getUsed();
        creep.work();
        if (creep.name.indexOf('E36S45') >= 0) {
          // console.log(`[CPU-INFO] ${creep.name} work: ${Game.cpu.getUsed() - workStart}`);
        }
      }
    }

    if (LOG_CPU_INFO) {
      console.log(`[CPU-INFO] Creep.work: ${Game.cpu.getUsed() - cpustart}`);
      cpustart = Game.cpu.getUsed();
    }

    // 让炮塔行动
    for (let name in Game.structures) {
      let structure = Game.structures[name];
      if (structure.structureType == STRUCTURE_TOWER) {
        roleTower.run(structure);
      }
    }

    // Link 1
    var RunLinkRoom1 = function() {
        let link2 = Game.getObjectById(util.constant.idLinkDown) as StructureLink;
        let link3 = Game.getObjectById(util.constant.idRoom1.linkLeft) as StructureLink;
        if (link3.store[RESOURCE_ENERGY] >= 700 && link2.store[RESOURCE_ENERGY] == 0 && !link2.gotEnergy) {
            link3.transferEnergy(link2);
            link2.gotEnergy = true;
        }
    };
    RunLinkRoom1();

    if (LOG_CPU_INFO) {
        console.log(`[CPU-INFO] Tower&Link: ${Game.cpu.getUsed() - cpustart}`);
        cpustart = Game.cpu.getUsed();
    }

    CarrierManagerSave();
    if (Game.cpu.getUsed() < 19) creepManager.runSpawn();
    if (Game.cpu.bucket >= 5000) MarketMain();

    if (LOG_CPU_INFO) {
        console.log(`[CPU-INFO] Spawn & CarrierManager & Market: ${Game.cpu.getUsed() - cpustart}`);
        cpustart = Game.cpu.getUsed();
    }

    // if (Game.cpu.getUsed() >= 19) return;
    // let factory = util.myRoom().find(FIND_MY_STRUCTURES, {
    //     filter: (structure: Structure) => {
    //         return structure.structureType == STRUCTURE_FACTORY;
    //     }
    // })[0] as StructureFactory;
    // if (factory) {
    //     if (factory.produce(RESOURCE_LEMERGIUM_BAR) != OK) {
    //         factory.produce(RESOURCE_CELL);
    //     }
    // }

    runHook(global.tickEndHook);
  });
});
