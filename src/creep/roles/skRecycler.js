/**
 * Recycler for SK room
 * forked from outerCarrier
 */

import util from '@/util.js';
import creepCommon from '@/creep.common.js';
import taskCommon from '@/task.common.js';

const defaultEarlyStop = 100;
const skSafeRange = 5;
const skWaitRange = 7;

import { GetDanger } from './outerDigger';
import { RoomDanger } from '../../skRoom';

export default (args) => ({
    // args.roomName, args.sourceIdList, args.targetId
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

        if (RoomDanger(args.roomName)) {
            creep.memory.retreat = true;
            return true;
        }

        // ----------

        if (creep.store.getFreeCapacity() == 0) {
            return true;
        }

        // ----------
        // 判断小退

        let sk = GetDanger(creep.pos);
        if (sk) {
            creep.driveTo(sk, {range: skSafeRange, flee: true});
            return false;
        }

        // ----------
        // 搜寻目标

        if (creep.memory.quickFinish) {
            // 如果着急回家，就快速切换状态
            return true;
        }

        const sourceList = args.sourceIdList.map(id => Game.getObjectById(id)).filter(obj => !!obj && !GetDanger(obj.pos));

        let source;
        if (creep.memory.currentSourceId) {
            source = Game.getObjectById(creep.memory.currentSourceId);
            if (!sourceList.find(obj => obj.id === creep.memory.currentSourceId)) {
                source = null;
                creep.memory.currentSourceId = null;
            }
        }
        if (!source) {
            // find new source
            if (creep.room.name != args.roomName) {
                creep.driveTo(new RoomPosition(25, 25, args.roomName), {range: 20});
                return false;
            }
            source = creep.pos.findClosestByRange(sourceList);
            if (source) creep.memory.currentSourceId = source.id;
        }
        if (!source) return true;

        // ----------
        // 工作

        if (!creep.pos.inRangeTo(source, 1)) {
            creep.repairRoad();
            creep.driveTo(source, {range: 1});
            return false;
        }

        if (creep.pickup(source) === ERR_INVALID_TARGET) {
            // need withdraw method
            for (let resourceType in source.store) {
                creep.withdraw(source, resourceType);
                return false;
            }
        }
        return false;
    },

    target: creep => {
        // ----------
        // 判断大撤退

        let earlyStop = args.earlyStop ? args.earlyStop : defaultEarlyStop;
        if (creep.ticksToLive < earlyStop) {
            creep.memory.quickFinish = true;
        }

        if (RoomDanger(args.roomName)) {
            creep.memory.retreat = true;
        } else {
            creep.memory.retreat = false;
            creep.memory.nearTarget = false;
        }

        // ----------
        // 小退

        let sk = GetDanger(creep.pos);
        if (sk) {
            creep.driveTo(sk, {range: skSafeRange, flee: true});
            return false;
        }

        // ----------
        // 工作

        if (creep.store.getUsedCapacity() == 0) {
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

        const target = Game.getObjectById(args.targetId);
        if (!target) {
            console.log('[ERROR] SK Recycler Missing Target ' + args.targetId);
            return false;
        }

        if (!creep.pos.inRangeTo(target, 1)) {
            creep.repairRoad();
            creep.driveTo(target, {range: 1});
            return false;
        }

        for (let resourceType in creep.store) {
            creep.transfer(target, resourceType);
            return false;
        }
        if (creep.memory.retreat) {
            creep.memory.nearTarget = true;
        }
        return false;
    },

    wait: creepCommon.waitOffRoad(),
});
