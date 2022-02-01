/**
 * 检查是否需要 SOS creep。如果没有 master creep 并且没有足够 energy 来 spawn，则返回 true。
 * master creep 一般指的是 carrier from storage.
 */
Room.prototype.NeedSOS = function(masterName, masterCost) {
    if (this.energyAvailable >= masterCost) {
        return false;
    }
    let numMaster = _.filter(Game.creeps, (creep) => creep.memory.configName == masterName).length;
    return numMaster == 0;
}

Room.prototype.findHostileCreeps = function() {
    return this.hostileCreeps;
};

Room.prototype.findHostileStructures = function() {
    return this.find(FIND_HOSTILE_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType !== STRUCTURE_KEEPER_LAIR;
        }
    });
};

Room.prototype.findSourceKeepers = function() {
    return this.keepers;
};

Room.prototype.getSpawnNameList = function() {
    if (!this.spawnNameList) {
        this.spawnNameList = this.find(FIND_MY_SPAWNS).map((spawn) => {
            return spawn.name;
        });
    }
    return this.find(FIND_MY_SPAWNS).map((spawn) => {
        return spawn.name;
    });
};
