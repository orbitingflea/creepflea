/**
 * 专门为 Source Keeper 房间设计的杀手
 *
 * 在当前房间内索敌，记在内存中
 * 战斗模式：
 * - 如果生命值高于 threshold_high，则进入 3 距离以内，用 RANGED_ATTACK 攻击敌人，同时治疗自身
 * - 如果生命值低于 threshold_low，则进入 3 距离以外，用 HEAL 治疗自身
 *
 * 准备阶段完成之后一直处于这个房间之内
 *
 * TODO 在打击入侵者时，如果地方阵型长时间不动，则假设敌方一直不会移动，找到一个最有利于 ranged mass attack 的地方。
 */

import util from 'util.js';
import creepCommon from 'creep.common.js';

const lairWaitRange = 5;

function fight(creep, hostileCreeps) {
    creep.heal(creep);
    let closest = creep.pos.findClosestByRange(hostileCreeps);
    if (closest) {
        creep.driveTo(closest.pos, {
            range: 1
        });
    }
    let sum = 0;
    for (let i = 0; i < hostileCreeps.length; i++) {
        let dist = creep.pos.getRangeTo(hostileCreeps[i]);
        if (dist === 1) {
            sum += 12;
        } else if (dist === 2) {
            sum += 6;
        } else if (dist === 3) {
            sum += 3;
        }
    }
    if (sum >= 12) {
        creep.rangedMassAttack();
    } else if (closest) {
        creep.rangedAttack(closest);
    }
}

export default (args) => ({
    // {roomName, hurtTolerance = 3}
    prepare: creepCommon.prepareGotoRoom(args.roomName),
    source: creep => {
        return true;
    },

    target: creep => {
        const room = args.roomName ? Game.rooms[args.roomName] : creep.room;
        if (!room) {
            if (creep.driveAhead() === OK) return false;
            creep.driveTo(new RoomPosition(25, 25, args.roomName), {
                range: 20
            });
            return false;
        }

        let hostileCreeps;
        let target;
        if (creep.memory.target) {
            target = Game.getObjectById(creep.memory.target);
            if (!target) creep.memory.target = null;
        }

        if (creep.room.name != args.roomName) {
            // 还没到，不要索敌
            creep.driveTo(new RoomPosition(25, 25, args.roomName), {
                range: 20
            });
            return false;
        }

        hostileCreeps = room.hostileCreeps;
        if (hostileCreeps.length > 0) {
            fight(creep, hostileCreeps);
            return false;
        }

        // if (!creep.memory.target) {
        //     hostileCreeps = room.hostileCreeps;
        //     if (hostileCreeps.length > 0) {
        //         let candidate = hostileCreeps.filter(c => c.getActiveBodyparts(HEAL) > 0);
        //         target = creep.pos.findClosestByRange(candidate.length > 0 ? candidate : hostileCreeps);
        //         creep.memory.target = target.id;
        //     }
        // }

        // 特殊：寻找红旗，攻击 road
        if (!creep.memory.target) {
            let flag = creep.pos.findClosestByRange(FIND_FLAGS, {
                filter: flag => flag.color === COLOR_RED &&
                    flag.pos.lookFor(LOOK_STRUCTURES).length > 0
            });
            // console.log(`${creep.name} find flag: ${flag ? flag.name : 'null'}`);
            if (flag) {
                target = flag.pos.lookFor(LOOK_STRUCTURES)[0];
                creep.memory.target = target.id;
            }
        }

        if (!creep.memory.target) {
            hostileCreeps = room.keepers;
            if (hostileCreeps.length > 0) {
                target = creep.pos.findClosestByPath(hostileCreeps);
                creep.memory.target = target.id;
            }
        }

        let hurtTolerance = args.hurtTolerance || 3;
        let heavyHurt = (creep.hitsMax - creep.hits) > hurtTolerance * 100;
        if (creep.memory.target) {
            // target is a true enemy
            // action
            creep.heal(creep);
            creep.rangedAttack(target);

            // mode control
            if (!creep.memory.mode) {
                creep.memory.mode = heavyHurt ? 'heal' : 'attack';
            }
            if (creep.memory.mode == 'heal') {
                if (!heavyHurt) creep.memory.mode = 'attack';
            } else {
                if (heavyHurt) creep.memory.mode = 'heal';
            }

            // movement: control distance
            let expectedDistance = creep.memory.mode === 'heal' ? 4 : 3;
            creep.driveTo(target, {
                range: expectedDistance,
                rangeMin: expectedDistance,
                keeperAttitude: 'passive',
                dangerAttitude: 'passive'
            });
            return false;
        }

        // ----------
        // 治疗除去自身的单位

        let healCreeps = room.find(FIND_MY_CREEPS, {
            filter: (c) => {
                return c.hits < c.hitsMax && c.id !== creep.id;
            }
        });
        if (healCreeps.length) {
            let target = creep.pos.findClosestByPath(healCreeps);
            if (!target) target = healCreeps[0];
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.driveTo(target, {
                    range: 1,
                    keeperAttitude: 'passive',
                    dangerAttitude: 'passive'
                });
                if (creep.hits < creep.hitsMax) creep.heal(creep);
                return false;
            }
            creep.heal(target);
            return false;
        }

        let lairs = room.find(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_KEEPER_LAIR;
            }
        });
        if (lairs.length) {
            let target = null;
            let minTicks = 500;
            for (let lair of lairs) {
                let ticks = lair.ticksToSpawn;
                if (ticks != null && ticks < minTicks) {
                    minTicks = ticks;
                    target = lair;
                }
            }
            if (target) {
                creep.driveTo(target, {
                    range: lairWaitRange,
                    offRoad: true,
                    keeperAttitude: 'passive',
                    dangerAttitude: 'passive'
                });
                if (creep.hits < creep.hitsMax) creep.heal(creep);
                return false;
            }
        }

        return false;
    },

    wait: creepCommon.waitOffRoad(),
});
