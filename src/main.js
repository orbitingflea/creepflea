import { errorMapper } from '@/modules/errorMapper';
import profiler from 'screeps-profiler';

import './functionManager.js';  // must import early

import util from '@/util.js';
import roleTower from '@/role.tower.js';
import { CleanUp as MemRoomObjectCleanUp } from '@/memory.roomObject.js';

import '@/creep/creepManager.js';
import '@/carrierManager.js';
import '@/creep/mountCreepRoles.js';
import '@/prototypes/prototypeMain.js';
import '@/movement/moveMain.js';
import '@/cache/cacheMain.js';

import MarketMain from '@/market.js';
import { CarrierManagerSave } from '@/carrierManager.js';

const LOG_CPU_INFO = 0;

profiler.enable();
export const loop = errorMapper(function() {
profiler.wrap(function() {
    if (Game.cpu.bucket >= 10000) {
        Game.cpu.generatePixel();
    }

    // 清理无效的 creep memory
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clear invalid memory for Creep: ', name);
        }
    }
    if (!Memory.roomObjects) {
        Memory.roomObjects = {};
    }
    MemRoomObjectCleanUp();

    let cpustart = Game.cpu.getUsed();
    if (LOG_CPU_INFO) {
        console.log(`[CPU-INFO] Init: ${cpustart}`);
    }

    CreepManager.RunUpdate();

    if (LOG_CPU_INFO) {
        console.log(`[CPU-INFO] CreepManager.Update: ${Game.cpu.getUsed() - cpustart}`);
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
        var link2 = Game.getObjectById(util.constant.idLinkDown);
        var link3 = Game.getObjectById(util.constant.idRoom1.linkLeft);
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
    if (Game.cpu.getUsed() < 19) CreepManager.RunSpawn();
    if (Game.cpu.bucket >= 5000) MarketMain();

    if (LOG_CPU_INFO) {
        console.log(`[CPU-INFO] Spawn & CarrierManager & Market: ${Game.cpu.getUsed() - cpustart}`);
        cpustart = Game.cpu.getUsed();
    }
    
    if (Game.cpu.getUsed >= 19) return;
    let factory = util.myRoom().find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_FACTORY;
        }
    })[0];
    if (factory) {
        if (factory.produce(RESOURCE_LEMERGIUM_BAR) != OK) {
            factory.produce(RESOURCE_CELL);
        }
    }
});
});

import { RoomDanger } from './skRoom.js';
global.RoomDanger = RoomDanger;