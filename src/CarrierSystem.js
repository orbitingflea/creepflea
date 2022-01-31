import util from 'util.js';

export function UpdateStructureStatus(room) {
    // for each structure that may need energy, update obj.memory.needEnergy
    // spawn & extensions always need energy if they are not full

    var structures = room.find(FIND_STRUCTURES);
    for (var i in structures) {
        var structure = structures[i];
        if (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION) {
            structure.memory.needEnergy = structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        } else if (structure.structureType == STRUCTURE_TOWER) {
            let lim = structure.store.getCapacity(RESOURCE_ENERGY);
            let cur = structure.store[RESOURCE_ENERGY];
            if (cur >= lim * 0.95) {
                structure.memory.needEnergy = false;
            } else if (cur < lim * 0.75) {
                structure.memory.needEnergy = true;
            }
        } else if (structure.structureType == STRUCTURE_CONTAINER) {
            if (structure.memory.isContainerNearController || structure.memory.isContainerNearController) {
                let lim = structure.store.getCapacity(RESOURCE_ENERGY);
                let cur = structure.store[RESOURCE_ENERGY];
                if (cur >= lim * 0.95) {
                    structure.memory.needEnergy = false;
                } else if (cur < lim * 0.75) {
                    structure.memory.needEnergy = true;
                }
            }
        } else if (structure.structureType == STRUCTURE_LAB) {
            let lim = structure.store.getCapacity(RESOURCE_ENERGY);
            let cur = structure.store[RESOURCE_ENERGY];
            if (cur >= lim * 0.95) {
                structure.memory.needEnergy = false;
            } else if (cur < lim * 0.75) {
                structure.memory.needEnergy = true;
            }
        }
    }
}
