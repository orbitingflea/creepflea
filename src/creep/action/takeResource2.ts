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

function getSourceAmount(item: DemandItem) {
  let r = item.resType;
  let source = item.obj;
  if (source instanceof Structure || source instanceof Ruin || source instanceof Tombstone) {
    if (source.store === undefined) return 0;
    return source.store[r];
  } else if (source instanceof Resource) {
    if (r === source.resourceType) {
      return source.amount;
    } else {
      return 0;
    }
  } else if (source instanceof Source) {
    if (r === RESOURCE_ENERGY) {
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
function takeResourceFromSource(creep: Creep, info: DemandItem): number {
  let myFreeCap = getFreeCapacity(creep.store);
  let resource = info.resType;
  if (!(info.obj instanceof RoomObject)) return 0;
  let source = info.obj;

  if (source instanceof Structure || source instanceof Ruin || source instanceof Tombstone) {
    let amount = Math.min(source.store![resource], myFreeCap, info.amount);
    if (amount) {
      creep.withdraw(source, resource, amount);
      return amount;
    }
  } else if (source instanceof Resource) {
    if (resource === source.resourceType) {
      creep.pickup(source);  // amount not used in this case
      return Math.min(source.amount, myFreeCap);
    }
  } else if (source instanceof Source) {
    if (resource === RESOURCE_ENERGY) {
      let nWorks = creep.getActiveBodyparts(WORK);
      if (source.energy > 0 && nWorks > 0) {
        creep.harvest(source);
        return Math.min(source.energy, myFreeCap, 2 * nWorks);
      }
    }
  } else {
    console.log(`[ERROR] takeResourceFromSource: ${source} type not implemented.`);
  }

  return 0;
}

Creep.prototype.takeResource2 = function(sources: DemandItem[]): number {
  if (getFreeCapacity(this.store) === 0) {
    return NOTHING_TO_DO;
  }

  let visibleSources: DemandItem[] = [];
  let invisibleObjects: DemandItem[] = [];
  for (let item of sources) {
    let obj = item.obj instanceof RoomObject ? item.obj : Game.getObjectById(item.obj.id);
    if (obj) {
      if (getSourceAmount(item) > 0) {
        visibleSources.push(item);
      }
    } else if (item.roomName) {
      invisibleObjects.push(item);
    }
  }

  for (let item of visibleSources) {
    if (this.pos.isNearTo(item.obj as RoomObject)) {
      if (this._worked) return BLOCKED;
      takeResourceFromSource(this, item);
      this._worked = true;
      return OK;
    }
  }

  let moveTargets = (visibleSources.map(item => item.obj) as (RoomObject | BlindObject)[])
      .concat(invisibleObjects.map(item => ({id: item.obj.id, roomName: item.roomName})));
  if (moveTargets.length > 0) {
    if (this._moved) return BLOCKED;
    this.driveToAny(moveTargets, {range: 1});
    this._moved = true;
    return OK;
  }
  return NOTHING_TO_DO;
}
