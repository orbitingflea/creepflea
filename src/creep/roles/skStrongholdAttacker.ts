/**
 * 攻城狮，攻击 roomName 中的要塞
 */

import creepCommon from 'creep.common.js';

function ShouldAttack(s: Structure) {
    return (s.structureType === STRUCTURE_INVADER_CORE ||
        s.structureType === STRUCTURE_TOWER && !(s as StructureTower).my ||
        s.structureType === STRUCTURE_RAMPART && !(s as StructureRampart).my &&
        s.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_CONTAINER));
}

function TryToFollowFlag(creep: Creep) {
    let stayFlags = creep.room.find(FIND_FLAGS, {
        filter: (f) => f.name.startsWith('stay')
    });
    if (stayFlags.length > 0) {
        if (!stayFlags.some((f) => f.pos.isEqualTo(creep.pos))) {
            // move to stay flag
            let pos = stayFlags.find((f) => !f.pos.underCreep)?.pos;
            if (pos) {
                creep.heal(creep);
                creep.driveTo(pos, {range: 0});
                return true;
            }
        }
    }
    // no stay flag, or reached stay flag

    let attackFlags = creep.room.find(FIND_FLAGS, {
        filter: (f) => f.name.startsWith('attack')
    });
    if (attackFlags.length > 0) {
        for (let f of attackFlags) {
            let pos = f.pos;
            if (!pos.inRangeTo(creep.pos, 3)) {
                continue;
            }
            let structures = pos.lookFor(LOOK_STRUCTURES);
            for (let s of structures) {
                creep.rangedAttack(s);
                creep.heal(creep);
                return true;
            }
        }
    }

    console.log(`[WARN] not following flags`);
    return false;
}

export default (args: {
    roomName: string;
}) => ({
    prepare: creepCommon.prepareGetBoosted({tough: 'XGHO2', heal: 'XLHO2', ranged_attack: 'XKHO2'}),
    source: (creep: Creep) => {
        return true;
    },

    target: (creep: Creep) => {
        const room = args.roomName ? Game.rooms[args.roomName] : creep.room;
        if (!room) {
            if (!!creep.memory.driveInfo) {
                if (creep.driveStep()) return false;
            }
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

        if (creep.room.name !== args.roomName) {
            // 还没到，不要索敌
            creep.driveTo(new RoomPosition(25, 25, args.roomName), {
                range: 20,
            });
            return false;
        }

        if (TryToFollowFlag(creep)) return false;

        if (!creep.memory.target) {
            hostileCreeps = room.invaders.filter(c => c.pos.lookFor(LOOK_STRUCTURES).every(s => s.structureType !== STRUCTURE_RAMPART));
            if (hostileCreeps.length > 0) {
                target = creep.pos.findClosestByRange(hostileCreeps);
                if (target) creep.memory.target = target.id;
            }
        }

        if (!creep.memory.target) {
            let hostileStructures = room.structures.filter(ShouldAttack);
            if (hostileStructures.length > 0) {
                target = creep.pos.findClosestByRange(hostileStructures);
                if (target) {
                    creep.memory.target = target.id;
                }
            }
        }

        if (!creep.memory.target) {
            hostileCreeps = room.keepers;
            if (hostileCreeps.length > 0) {
                target = creep.pos.findClosestByPath(hostileCreeps);
                if (target) creep.memory.target = target.id;
            }
        }

        // ----------
        // 已索敌，冲上去打
        if (target) {
            creep.heal(creep);
            if (creep.pos.inRangeTo(target as RoomObject, 3)) {
                creep.rangedAttack(target as Structure | Creep);
                return false;
            } else {
                creep.driveTo(target as RoomObject, {range: 3, offRoad: true});
                return false;
            }
        }

        // ----------
        // 治疗除去自身的单位

        let healCreeps = room.find(FIND_MY_CREEPS, {
            filter: (c) => {
                return c.hits < c.hitsMax && c.id !== creep.id;
            }
        });
        if (healCreeps.length) {
            let target = creep.pos.findClosestByRange(healCreeps);
            if (!target) target = healCreeps[0];
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.driveTo(target, {range: 1});
                if (creep.hits < creep.hitsMax) creep.heal(creep);
                return false;
            }
            creep.heal(target);
            return false;
        }

        creep.park();
        return false;
    }
});
