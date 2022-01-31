import util from '@/util.js';

export default {
    getPriority: function(structure) {
        if (structure.structureType == STRUCTURE_TOWER) {
            return 100;
        } else if (structure.structureType == STRUCTURE_RAMPART) {
            return -1;
        } else if (structure.structureType == STRUCTURE_ROAD) {
            return 20;
        } else if (structure.structureType == STRUCTURE_CONTAINER) {
            return 0;
        } else if (structure.structureType == STRUCTURE_STORAGE) {
            return 0;
        } else {
            return 0;
        }
    },

    run: function(tower) {
        // attack nearest hostile creep
        let target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return !creep.inWhiteList();
            }
        });
        if (target) {
            tower.attack(target);
            return;
        }

        // heal nearest wounded creep
        target = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => {
                return creep.hits < creep.hitsMax;
            }
        });
        if (target) {
            tower.heal(target);
            return;
        }

        if (tower.energy < tower.energyCapacity * 0.3) {
            return;
        }

        // repair damaged structure
        let damagedStructure = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => (structure.hits <= structure.hitsMax - 500 &&
                (structure.structureType != STRUCTURE_RAMPART || structure.hits < 10000 ||
                    (structure.hits >= util.constant.hitsMaxRampart - 10000 &&
                     structure.hits <= util.constant.hitsMaxRampart)) &&
                structure.structureType != STRUCTURE_WALL)
        });
        target = damagedStructure[0];
        // find the one with largest priority
        for (var i in damagedStructure) {
            if (this.getPriority(damagedStructure[i]) > this.getPriority(target)) {
                target = damagedStructure[i];
            }
        }
        if (target) {
            tower.repair(target);
            return;
        }
    }
};