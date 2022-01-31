/**
 * 本文件仅在代码加载时被执行一次，用于整个系统的初始化。
 * 这个文件会定义 hooks、挂载 hooks，以及调用其他模块的初始化程序。
 */

global.tickBeginHook = [];
global.tickEndHook = [];

import 'creep/creepManager.js';
import 'carrierManager.js';
import 'creep/mountCreepRoles.js';
import 'prototypes/prototypeMain.js';
import 'movement/moveMain.js';
import 'cache/cacheMain.js';

import 'service/load';

// global.tickBeginHook.push(() => {
//   console.log(`[INFO] Tick ${Game.time} is running`);
// });

// global.tickEndHook.push(() => {
//   console.log(`[INFO] CPU used: ${Game.cpu.getUsed()}`);
// });
