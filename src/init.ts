/**
 * 本文件仅在代码加载时被执行一次，用于整个系统的初始化。
 * 这个文件会定义 hooks、挂载 hooks，以及调用其他模块的初始化程序。
 */

import 'initHook';

import 'creep/creepManager.js';
import 'carrierManager.js';
import 'creep/mountCreepRoles.js';
import 'prototypes/prototypeMain.js';
// import 'movement/_moveMain.js';

import 'service/load';

import 'movement/main';
import 'movement/destination';
import 'movement/utils';

global.tickEndHook.push(() => {
  for (let name in Memory.rooms) {
    if (roomDanger(name) && !Memory.rooms[name]._spawnedDefender) {
      Memory.rooms[name]._spawnedDefender = true;
      CreepManager.AddTmpRequire('OuterDefender_' + name, 1);
    }
  }
})

// global.tickEndHook.push(() => {
//   for (let name in Game.creeps) {
//     Memory.creeps[name].driveInfo = Game.creeps[name].cache.driveInfo;
//   }
// });

// debug
// import { LRUMap } from 'lib/lru/lru';

// global.tickBeginHook.push(() => {
//   let test = new LRUMap(10);
//   test.set('a', {
//     path: [23, 233, 2333],
//     cost: 3
//   });
//   console.log(`[TEST] ${JSON.stringify(test.get('a'))}`);
// })
