import roleCarrier from './roles/carrier.js';
import roleCarrierCenter from './roles/carrierCenter.js';
import roleDigger from './roles/digger.js';
import roleDiggerLink from './roles/diggerLink.js';

import roleRecycler from './roles/recycler.js';
import roleUpgrader from './roles/upgrader.js';
import roleWorker from './roles/worker.js';
import roleMiner from './roles/miner.js';
import roleClaimer from './roles/claimer.js';
import roleReserver from './roles/reserver.js';
import roleBasicUpgrader from './roles/basicUpgrader.js';
import roleBasicHarvester from './roles/basicHarvester.js';
import roleOuterHarvester from './roles/outerHarvester.js';

import roleOuterDigger from './roles/outerDigger.js';
import roleOuterCarrier from './roles/outerCarrier.js';
import roleOuterDefender from './roles/outerDefender.js';
import roleOuterAttacker from './roles/outerAttacker.js';

import roleSkGuard from './roles/skGuard.js';
import roleSkStrongholdAttacker from './roles/skStrongholdAttacker.ts';
// import roleSkDigger from './roles/skDigger.js';
// import roleSkDefender from './roles/skDefender.js';

const roles = {
    carrier: roleCarrier,
    carrierCenter: roleCarrierCenter,
    digger: roleDigger,
    diggerLink: roleDiggerLink,
    recycler: roleRecycler,
    upgrader: roleUpgrader,
    worker: roleWorker,
    miner: roleMiner,
    claimer: roleClaimer,
    reserver: roleReserver,
    basic_upgrader: roleBasicUpgrader,
    basicUpgrader: roleBasicUpgrader,
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
};

Creep.prototype.work = function() {
    if (this.spawning) return;
    const creepConfig = CreepManager.GetLogic(this.memory.configName);
    // 检查 creep 内存中的配置是否存在
    if (!creepConfig) {
        console.log(`creep ${this.name} 携带了一个无效的配置项 ${this.memory.configName}`);
        this.say('找不到配置');
        return;
    }
    const creepLogic = roles[creepConfig.role](creepConfig.args);

    if (!this.memory.ready) {
        // 有准备阶段配置则执行
        // 没有就直接准备完成
        if (creepLogic.prepare) {
            this.memory.ready = creepLogic.prepare(this);
        } else {
            this.memory.ready = true;
        }
        if (!this.memory.ready) return;
    }

    let stateChange = true, wait = false;
    // 执行对应阶段
    // 阶段执行结果返回 true 就说明需要更换 working 状态
    // 要求 source, target 返回 true 时不改变游戏状态（在开始阶段判定）
    if (this.memory.working) {
        if (creepLogic.target) stateChange = creepLogic.target(this);
        if (stateChange) wait = creepLogic.source(this);
    } else {
        if (creepLogic.source) stateChange = creepLogic.source(this);
        if (stateChange) wait = creepLogic.target(this);
    }
    // 状态变化了就切换工作阶段
    if (wait) {
        stateChange = false;
        this.memory.working = false;
        if (creepLogic.wait) creepLogic.wait(this);
    }
    if (stateChange) {
        this.memory.working = !this.memory.working;
    }
};
