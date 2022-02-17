/**
 * Creep.takeResource(sources, resourceType = 'energy', moveOnly = false);
 * @param sources: 容器，能量源，掉落资源；RoomObject / Id / BlindObject, or array of them
 * @param resourceType
 * @param moveOnly
 * @returns
 * - OK
 * - NOTHING_TO_DO
 * - COMPLETE_WITHOUT_MOVE
 */

import { ensureArray } from "lib/utils";

Creep.prototype.takeResource = function(
  from: RoomObject | Id<RoomObject> | BlindObject | (RoomObject | Id<RoomObject> | BlindObject)[],
  resource: ResourceConstant | 'all',
  moveOnly: boolean = false
): number {
  // use _takeResource
  let list: BlindObject[] = ensureArray(from).map(item => {
    if (item instanceof RoomObject) {
      return {
        id: item.id,
        roomName: item.pos.roomName,
      };
    } else if (typeof item === 'string') {
      return {
        id: item,
      };
    } else {
      return item;
    }
  });
  return this._takeResource(list, resource, moveOnly);
}

function getSourceAmount(source: RoomObject, resource: ResourceConstant | 'all') {
  if (source instanceof Structure || source instanceof Ruin || source instanceof Tombstone) {
    if (source.store === undefined) {
      return 0;
    }
    if (resource === 'all') {
      return source.store.getUsedCapacity();
    } else {
      return source.store[resource];
    }
  } else if (source instanceof Resource) {
    if (resource === 'all' || resource === source.resourceType) {
      return source.amount;
    } else {
      return 0;
    }
  } else if (source instanceof Source) {
    if (resource === 'all' || resource === RESOURCE_ENERGY) {
      return source.energy;
    } else {
      return 0;
    }
  } else {
    console.log(`[ERROR] getSourceAmount: ${source} type not implemented.`);
    return 0;
  }
}

// return the predicted taken amount
// does not perform validation check
function takeResourceFromSource(creep: Creep, source: RoomObject, resource: ResourceConstant | 'all'): number {
  let myFreeCap = creep.store.getFreeCapacity();
  if (source instanceof Structure || source instanceof Ruin || source instanceof Tombstone) {
    if (resource === 'all') {
      let ignoreEnergy = source.store!.getUsedCapacity() > source.store![RESOURCE_ENERGY];
      for (let type in source.store!) {
        if (ignoreEnergy && type === RESOURCE_ENERGY) continue;
        let amount = Math.min(source.store![type as ResourceConstant], myFreeCap);
        if (amount > 0) {
          creep.withdraw(source, type as ResourceConstant, amount);
          return amount;
        }
      }
      // console.log(`[ERROR] takeResourceFromSource: ${source} entered impossible branch.`);
    } else {
      let amount = Math.min(source.store![resource], myFreeCap);
      if (amount) {
        creep.withdraw(source, resource, amount);
        return amount;
      }
    }
  } else if (source instanceof Resource) {
    if (resource === 'all' || resource === source.resourceType) {
      creep.pickup(source);
      return Math.min(source.amount, myFreeCap);
    }
  } else if (source instanceof Source) {
    if (resource === 'all' || resource === RESOURCE_ENERGY) {
      let nWorks = creep.getActiveBodyparts(WORK);
      if (source.energy > 0 && nWorks > 0) {
        creep.harvest(source);
        return Math.min(Math.min(source.energy, myFreeCap), 2 * nWorks);
      }
    }
  } else {
    console.log(`[ERROR] takeResourceFromSource: ${source} type not implemented.`);
  }

  return 0;
}

Creep.prototype._takeResource = function(from: BlindObject[], resource: ResourceConstant | 'all', moveOnly: boolean): number {
  if (this.store.getFreeCapacity() === 0 && !moveOnly) {
    return NOTHING_TO_DO;
  }

  let visibleSources: RoomObject[] = [];
  let invisibleObjects: BlindObject[] = [];
  for (let item of from) {
    let obj = Game.getObjectById(item.id);
    if (obj) {
      if (getSourceAmount(obj, resource) > 0) {
        visibleSources.push(obj);
      }
    } else if (item.roomName) {
      invisibleObjects.push(item);
    }
  }

  let takenId: null | Id<RoomObject> = null;
  let runOut = false;
  let getFull = false;
  if (!moveOnly) {
    for (let source of visibleSources) {
      if (this.pos.isNearTo(source)) {
        let res = takeResourceFromSource(this, source, resource);
        takenId = source.id;
        if (source instanceof Source) {
          getFull = this.store.getFreeCapacity() < res * 2;
        } else {
          const FULL_THRESHOLD = 0.95;
          getFull = (this.store.getUsedCapacity() + res) >= FULL_THRESHOLD * this.store.getCapacity();
        }
        if (res === getSourceAmount(source, resource)) {
          runOut = true;
        }
        break;
      }
    }
  }

  if (takenId) {
    if (getFull) {
      return COMPLETE_WITHOUT_MOVE;
    } else if (!runOut) {
      return OK;
    }
    // else continue
  }

  let moveTargets = (visibleSources as (RoomObject | BlindObject)[]).filter(s => s.id !== takenId).concat(invisibleObjects);
  if (moveTargets.length > 0) {
    this.driveToAny(moveTargets, {range: 1});
    return OK;
  } else {
    return takenId ? COMPLETE_WITHOUT_MOVE : NOTHING_TO_DO;
  }
}
