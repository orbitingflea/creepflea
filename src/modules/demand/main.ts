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

export function setDemandGive(structure: Structure, res: ResourceConstant | 'all', threshold: number) {
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
        if (res === 'all') {
          if (foo.all !== undefined && s.store!.getUsedCapacity() > foo.all!) {
            if (!sources.all) sources.all = [];
            sources.all!.push(s);
          }
        } else {
          const r = res as ResourceConstant;
          if (foo[r] !== undefined && s.store![r] >= foo[r]!) {
            if (!sources[r]) sources[r] = [];
            sources[r]!.push(s);
          }
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

// ----- version 2 -----

export function getAllDemand2(room: Room): [DemandItemP[], DemandItemP[]] {
  let sources: DemandItemP[] = [];
  let sinks: DemandItemP[] = [];

  for (let s of room.structuresOfTypes(STRUCTURE_SPAWN, STRUCTURE_EXTENSION)) {
    if (getFreeCapacity(s.store!, RESOURCE_ENERGY) > 0) {
      sinks.push({obj: s, resType: RESOURCE_ENERGY, amount: getFreeCapacity(s.store!, RESOURCE_ENERGY)});
    }
  }

  for (let s of room.structuresOfTypes(STRUCTURE_TOWER, STRUCTURE_LAB, STRUCTURE_POWER_SPAWN)
      .concat(room.structuresOfType(STRUCTURE_CONTAINER).filter(c => c.cache.isEnergySink))) {
    if (s.store![RESOURCE_ENERGY] < THRESHOLD_ENERGY_SINK * getCapacity(s.store!, RESOURCE_ENERGY)) {
      sinks.push({obj: s, resType: RESOURCE_ENERGY, amount: getFreeCapacity(s.store!, RESOURCE_ENERGY)});
    }
  }

  for (let s of room.structuresOfType(STRUCTURE_CONTAINER).filter(c => c.cache.isEnergySource)) {
    if (s.store![RESOURCE_ENERGY] > THRESHOLD_ENERGY_SOURCE * getCapacity(s.store!, RESOURCE_ENERGY)) {
      sources.push({obj: s, resType: RESOURCE_ENERGY, amount: Infinity});
    }
  }

  // --- recycler tasks ---

  for (let s of room.find(FIND_DROPPED_RESOURCES)) {
    if (s.amount >= DROPPED_ENERGY_THRESHOLD || s.resourceType !== RESOURCE_ENERGY) {
      sources.push({obj: s, resType: s.resourceType, amount: Infinity});
    }
  }

  for (let s of room.find(FIND_TOMBSTONES)) {
    if (getUsedCapacity(s.store) >= DROPPED_ENERGY_THRESHOLD || getUsedCapacity(s.store) > s.store.energy) {
      for (let t in s.store) {
        sources.push({obj: s, resType: t as ResourceConstant, amount: Infinity});
      }
    }
  }

  for (let s of room.find(FIND_RUINS)) {
    if (getUsedCapacity(s.store) > 0) {
      for (let t in s.store) {
        sources.push({obj: s, resType: t as ResourceConstant, amount: Infinity});
      }
    }
  }

  // --- manual tasks ---

  for (let s of room.functionalStructures) {
    if (s.hasCache && s.cache.needResourceIfBelow) {
      const foo = s.cache.needResourceIfBelow;
      for (let res in foo) {
        const r = res as ResourceConstant;
        if (foo[r] !== undefined && s.store![r] < foo[r]!) {
          sinks.push({obj: s, resType: r, amount: foo[r]! - s.store![r]});
        }
      }
    }
    if (s.hasCache && s.cache.giveResourceIfAbove) {
      const foo = s.cache.giveResourceIfAbove;
      for (let res in foo) {
        if (res === 'all') {
          if (foo.all !== undefined && getUsedCapacity(s.store!) > foo.all!) {
            for (let t in s.store) {
              sources.push({obj: s, resType: t as ResourceConstant, amount: Infinity});
            }
          }
        } else {
          const r = res as ResourceConstant;
          if (foo[r] !== undefined && s.store![r] >= foo[r]!) {
            sources.push({obj: s, resType: r, amount: Infinity});
          }
        }
      }
    }
  }

  if (room.storage) {
    adjustWithStorage(room, sources, sinks);
  }
  return [sources, sinks];
}

function adjustWithStorage(room: Room, sources: DemandItemP[], sinks: DemandItemP[]) {
  let storage = room.storage;
  if (!storage) return;
  let requireNum: {[r in ResourceConstant]?: number} = {};
  let hasSource: {[r in ResourceConstant]?: boolean} = {};
  for (let s of sinks) {
    if (requireNum[s.resType] === undefined) requireNum[s.resType] = 0;
    requireNum[s.resType]! += s.amount;
  }
  for (let s of sources) {
    hasSource[s.resType] = true;
  }

  // assign sinks of storage
  if (getFreeCapacity(storage.store) > 0) {
    for (let r in RESOURCES_ALL) {
      if (!requireNum[r as ResourceConstant]) {
        sinks.push({obj: storage, resType: r as ResourceConstant, amount: Infinity});
      }
    }
  }

  for (let r in requireNum) {
    if (storage.store[r as ResourceConstant]) {
      sources.push({obj: storage, resType: r as ResourceConstant, amount: Infinity});  // TODO restrict the amount
    }
  }
}
