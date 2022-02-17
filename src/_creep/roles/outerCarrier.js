/**
 * 本文件描述的是外矿搬运者的工作逻辑
 * args 包含 roomName, resourcePosition, targetId
 * 其中 resourcePosition 等于 outerDigger 的工作地点，能量有可能以 container 或 dropped resource 的形式存在
 * targetId 是搬运目标地点
 *
 * source mode:
 *  - 如果距离 resourcePosition 太远，则走过去
 *  - 如果没有 container
 *    - 如果有 dropped resource，collect，until full
 *    - 如果没有 dropped resource，则 wait
 *  - 如果有 container
 *    - 如果 container 满了，并且有很多 dropped resource，则 collect dropped resource
 *    - 如果 container 的能量足够装满 carrier，则 take energy from container
 *    - 如果 container 的能量不足，且存在 dropped resource，则 collect dropped resource
 *    - 如果 container 的能量不足，且没有 dropped resource，则 wait
 * 当装满了自己的 carry 时，切换到 target mode
 *
 * target mode:
 * 走到 target 并卸下货物
 * 如果 target 满了导致卸不下货物，则等待
 *
 * retreat mode:
 * 该模式在发现当前房间 invader 的时候被启用
 * 该模式的行为同 target，但当自己空载以后，不会切换到 source mode，而是就地停车
 * 当 roomName 房间有视野并且没有 invader 的时候，且自己空载，切换到 source mode
 *
 * creep.memory.quickFinish 是一个标志位，表示是否在快速模式下完成任务
 * 这个标志位在 creep 寿命较低时触发
 * 如果标记为 true，则：
 * - 在 source mode 中，在本来应该 wait 的时候，creep 进行一次拿取操作，返回 OK 后同时切换到 target mode，开始往回走
 * - 在 source mode 中，如果自己离 resourcePosition 远，则自杀，这时候是空载。
 * - 在 target mode 结束时，并不切换到 source mode，而是自杀。
 *
 * 可选参数：earlyStop，表示寿命还剩多少的时候开始 quickFinish
 *
 * Retreat 是大躲避，指的是撤退到 targetId 附近去。当发现有非 Source Keeper 的攻击者，则进入 Retreat 模式。
 *
 * 小躲避更加经常发生，不需要 memory 来记录。
 * 在任意工作模式，如果我在任意一个 source keeper 的安全距离以内，则在本步远离所有 source keeper。
 * 如果我想要前往某个位置，但那个位置不在安全区域，则前往一个更大的 range，路边等待
 *
 * TODO 修建 road
 */

import util from 'util.js';
import creepCommon from 'creep.common.js';
import taskCommon from 'task.common.js';

const defaultEarlyStop = 100;
const skSafeRange = 5;
const skWaitRange = 7;
const hurtTolerance = 3;

import { GetDanger } from './outerDigger';

export default (args) => ({
    // args.roomName, args.resourcePosition, args.targetId
    // optional: earlyStop, default is 100

    source: creep => {
        // ---------
        // 判断大撤退

        if (creep.memory.retreat) {
            return true;  // retreat 模式由 target 模式代理
        }

        let earlyStop = args.earlyStop ? args.earlyStop : defaultEarlyStop;
        if (creep.ticksToLive < earlyStop) {
            creep.memory.quickFinish = true;
        }

        if (roomDanger(args.roomName)) {
            creep.memory.retreat = true;
            return true;
        }

        // ----------

        if (creep.store[RESOURCE_ENERGY] == creep.store.getCapacity(RESOURCE_ENERGY)) {
            return true;
        }
        const pos = new RoomPosition(...args.resourcePosition, args.roomName);

        // ----------
        // 判断小退

        let rect = GetDanger(creep.pos);
        if (rect && rect.contains(creep.pos)) {
            console.log(`[DEBUG] Danger! ${creep.name}`);
            creep.driveTo(pos, {range: skWaitRange, offRoad: true, dangerZone: rect});
            return false;
        }

        // ----------
        // 前进

        if (rect && rect.contains(pos)) {
            if (creep.memory.quickFinish) {
                return true;
            }
            // console.log(`[DEBUG] 前进至危险区域边缘，offroad，我是 ${creep.name}`);
            creep.driveTo(pos, {range: skWaitRange, offRoad: true, dangerZone: rect});
            return false;
        }
        if (!creep.pos.inRangeTo(pos, 1)) {
            if (creep.memory.quickFinish) {
                if (creep.store[RESOURCE_ENERGY] > 0) {
                    return true;
                }
                creep.suicide();
                return false;
            }
            // console.log(`[DEBUG] I am ${creep.name}`)
            creep.driveTo(pos, {range: 1, dangerZone: rect});
            return false;
        }

        // ----------
        // 工作

        const containerList = pos.lookFor(LOOK_STRUCTURES, {filter: s => s.structureType == STRUCTURE_CONTAINER});
        let container;
        if (containerList.length) container = containerList[0];

        let threshold = 50;
        const resList = pos.lookFor(LOOK_RESOURCES, {
            filter: r => r.resourceType == RESOURCE_ENERGY && r.amount >= threshold
        });
        if (resList.length > 0) {
            const res = resList[0];
            creep.pickup(res);
            return false;
        }

        if (container) {
            if (container.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
                creep.withdraw(container, RESOURCE_ENERGY);
                return false;
            } else if (creep.memory.quickFinish) {
                creep.withdraw(container, RESOURCE_ENERGY);
                creep.dontSuicide = true;
                return true;  // hacky usage
            } else {
                creep.driveTo(container, {range: 1, offRoad: true});
                return false;  // wait
            }
        } else {
            return creep.memory.quickFinish;
        }
    },

    target: creep => {
        // ----------
        // 判断大撤退

        let earlyStop = args.earlyStop ? args.earlyStop : defaultEarlyStop;
        if (creep.ticksToLive < earlyStop) {
            creep.memory.quickFinish = true;
        }

        if (roomDanger(args.roomName)) {
            creep.memory.retreat = true;
        } else {
            creep.memory.retreat = false;
            creep.memory.nearTarget = false;
        }

        // ----------
        // 小退

        const target = Game.getObjectById(args.targetId);
        if (!target) {
            console.log('[ERROR] Outer Carrier Missing Target ' + args.targetId);
            return false;
        }

        let rect = GetDanger(creep.pos);
        if (rect && rect.contains(creep.pos)) {
            creep.driveTo(target, {range: 1, dangerZone: rect});
            return false;
        }

        // ----------
        // 工作

        if (creep.store[RESOURCE_ENERGY] == 0) {
            if (!creep.memory.retreat) {
                if (creep.memory.quickFinish) {
                    if (!creep.dontSuicide) {
                        creep.suicide();
                        return false;
                    }
                } else {
                    return true;
                }
            } else if (creep.memory.nearTarget) {
                creep.park();
                return false;
            }
        }

        if (!creep.pos.inRangeTo(target, 1)) {
            creep.repairRoad();
            creep.driveTo(target, {range: 1, dangerZone: rect});
            return false;
        }

        creep.transfer(target, RESOURCE_ENERGY);
        if (creep.memory.retreat) {
            creep.memory.nearTarget = true;
        }
        return false;
    },

    wait: creepCommon.waitOffRoad(),
});
