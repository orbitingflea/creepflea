/**
 * 本文件负责挂载 Creep.work，解析 config 并执行。
 * 向下兼容 js 版本的 prepare-source-target-wait 模式，以及新版本的模式。
 */

import roleCarrier from '_creep/roles/carrier.js';
import roleCarrierCenter from '_creep/roles/carrierCenter.js';
import roleDigger from '_creep/roles/digger.js';
import roleDiggerLink from '_creep/roles/diggerLink.js';

import roleRecycler from '_creep/roles/recycler.js';
import roleMiner from '_creep/roles/miner.js';
import roleClaimer from '_creep/roles/claimer.js';
import roleReserver from '_creep/roles/reserver.js';
import roleBasicHarvester from '_creep/roles/basicHarvester.js';
import roleOuterHarvester from '_creep/roles/outerHarvester.js';

import roleOuterDigger from '_creep/roles/outerDigger.js';
import roleOuterCarrier from '_creep/roles/outerCarrier.js';
import roleOuterDefender from '_creep/roles/outerDefender.js';
import roleOuterAttacker from '_creep/roles/outerAttacker.js';

import roleSkGuard from '_creep/roles/skGuard.js';
import roleSkStrongholdAttacker from '_creep/roles/skStrongholdAttacker';

import roleWorker from './develope/worker';

const roles: {[roleName: string]: (CreepRole | CreepRoleOld)} = {
  carrier: roleCarrier,
  carrierCenter: roleCarrierCenter,
  digger: roleDigger,
  diggerLink: roleDiggerLink,
  recycler: roleRecycler,

  miner: roleMiner,
  claimer: roleClaimer,
  reserver: roleReserver,
  basic_harvester: roleBasicHarvester,
  basicHarvester: roleBasicHarvester,
  outer_harvester: roleOuterHarvester,
  outerHarvester: roleOuterHarvester,
  outerDigger: roleOuterDigger,
  outerCarrier: roleOuterCarrier,
  outerDefender: roleOuterDefender,
  outerAttacker: roleOuterAttacker,
  skGuard: roleSkGuard,
  skStrongholdAttacker: roleSkStrongholdAttacker,

  worker: roleWorker,
  newWorker: roleWorker,
};

Creep.prototype.work = function() {
  if (this.spawning) return;
  const conf = creepManager.getConfigWork(this.memory.configName);
  if (!conf) {
    console.log(`Creep ${this.name} 携带无效配置名称 ${this.memory.configName}.`);
    this.say('找不到配置');
    return;
  }
  if (!(conf.role in roles)) {
    console.log(`Creep ${this.name} 属于无效角色 ${conf.role}.`);
    this.say('找不到角色');
    return;
  }
  const toRun = roles[conf.role](conf.args);
  if (toRun instanceof Function) {
    // 新版本，直接运行
    toRun(this);
    return;
  }

  // 旧版本，解析 prepare-source-target-wait
  if (toRun.prepare) {
    if (!this.memory.ready) {
      this.memory.ready = toRun.prepare(this);
      if (!this.memory.ready) return;
    }
  }
  let change = false, wait = false;
  let func = [
    toRun.source || (() => true),
    toRun.target || (() => true),
  ];

  let stateBefore = (this.memory.working! | 0);
  change = func[stateBefore](this);
  if (change) {
    wait = func[stateBefore ^ 1](this);
    if (wait) {
      change = false;
      this.memory.working = 0;
      if (toRun.wait) {
        toRun.wait(this);
      }
    }
  }
  if (change) {
    this.memory.working = (stateBefore ^ 1);
  }
}
