/**
 * 本文件给运营中的房间设定
 * 不包括垃圾回收、storage 和 terminal 的 demand。
 */

export function setDemandNeed(structure: Structure, res: ResourceConstant, threshold: number) {
  if (!structure.cache.needResourceIfBelow) {
    structure.cache.needResourceIfBelow = {};
  }
  structure.cache.needResourceIfBelow[res] = threshold;
}

export function setDemandGive(structure: Structure, res: ResourceConstant, threshold: number) {
  if (!structure.cache.giveResourceIfAbove) {
    structure.cache.giveResourceIfAbove = {};
  }
  structure.cache.giveResourceIfAbove[res] = threshold;
}

const THRESHOLD_ENERGY_SINK = 0.7;
const THRESHOLD_ENERGY_SOURCE = 0.3;
const DROPPED_ENERGY_THRESHOLD = 100;

export function getAllDemand(room: Room): [Demand, Demand] {
  let sources: Demand = {energy: [], all: []};
  let sinks: Demand = {energy: [], all: []};

  for (let s of room.structuresOfTypes(STRUCTURE_SPAWN, STRUCTURE_EXTENSION)) {
    if (s.store!.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      sinks.energy!.push(s);
    }
  }

  for (let s of room.structuresOfTypes(STRUCTURE_TOWER, STRUCTURE_LAB, STRUCTURE_POWER_SPAWN)
      .concat(room.structuresOfType(STRUCTURE_CONTAINER).filter(c => c.cache.isEnergySink))) {
    if (s.store![RESOURCE_ENERGY] < THRESHOLD_ENERGY_SINK * s.store!.getCapacity(RESOURCE_ENERGY)) {
      sinks.energy!.push(s);
    }
  }

  for (let s of room.structuresOfType(STRUCTURE_CONTAINER).filter(c => c.cache.isEnergySource)) {
    if (s.store![RESOURCE_ENERGY] > THRESHOLD_ENERGY_SOURCE * s.store!.getCapacity(RESOURCE_ENERGY)) {
      sources.energy!.push(s);
    }
  }

  // --- recycler tasks ---

  for (let s of room.find(FIND_DROPPED_RESOURCES)) {
    if (s.amount >= DROPPED_ENERGY_THRESHOLD || s.resourceType !== RESOURCE_ENERGY) {
      sources.all!.push(s);
    }
  }

  for (let s of room.find(FIND_TOMBSTONES)) {
    if (s.store.getUsedCapacity() >= DROPPED_ENERGY_THRESHOLD ||
        s.store.getUsedCapacity() > s.store.energy) {
      sources.all!.push(s);
    }
  }

  for (let s of room.find(FIND_RUINS)) {
    if (s.store.getUsedCapacity() > 0) {
      sources.all!.push(s);
    }
  }

  // --- manual tasks ---

  for (let s of room.functionalStructures) {
    if (s.hasCache && s.cache.needResourceIfBelow) {
      const foo = s.cache.needResourceIfBelow;
      for (let res in foo) {
        const r = res as ResourceConstant;
        if (foo[r] !== undefined && s.store![r] < foo[r]!) {
          if (!sinks[r]) sinks[r] = [];
          sinks[r]!.push(s);
        }
      }
    }
    if (s.hasCache && s.cache.giveResourceIfAbove) {
      const foo = s.cache.giveResourceIfAbove;
      for (let res in foo) {
        const r = res as ResourceConstant;
        if (foo[r] !== undefined && s.store![r] >= foo[r]!) {
          if (!sources[r]) sources[r] = [];
          sources[r]!.push(s);
        }
      }
    }
  }

  return addStorageDemand(room, sources, sinks);
}

export function addStorageDemand(room: Room, sources: Demand, sinks: Demand): [Demand, Demand] {
  let storage = room.storage;
  if (storage) {
    for (let res in sinks) {
      if (res !== 'all' && sinks[res as ResourceConstant]!.length > 0 && storage.store[res as ResourceConstant] > 0) {
        if (!sources[res as ResourceConstant]) sources[res as ResourceConstant] = [];
        sources[res as ResourceConstant]!.push(storage);
      }
    }
    if (!sinks.all) sinks.all = [];
    sinks.all.push(storage);
  }
  return [sources, sinks];
}
