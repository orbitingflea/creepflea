import { getTowerRepairTarget } from "modules/repair/main";

export default {
    run: function(tower) {
        // attack nearest hostile creep
        let target = tower.pos.findClosestByRange(tower.room.hostileCreeps);
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
        target = getTowerRepairTarget(tower.room);
        if (target) {
            tower.repair(target);
            return;
        }
    }
};
