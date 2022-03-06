/**
 * Creep.giveResource2(targets, resourceType = 'energy');
 * @param targets: 容器，lab；RoomObject / Id / BlindObject, or array of them
 * @param resourceType
 * @returns
 * - OK
 * - NOTHING_TO_DO
 * - COMPLETE_WITHOUT_MOVE
 */

import { ensureArray } from "lib/utils";

// if invalid, return 0
function getTargetFreeCapacity(target: RoomObject, resource: ResourceConstant): number {
  if (!(target instanceof Structure) || !target.store) return 0;
  return getFreeCapacity(target.store, resource);
}

function getMyStore(creep: Creep, resource: ResourceConstant): number {
  return creep.store[resource];
}

// return predicted transfer amount
function giveResourceToTarget(creep: Creep, info: DemandItem): number {
  let target = info.obj as Structure;
  let freeCap = getTargetFreeCapacity(target, info.resType);
  creep.transfer(target, info.resType);
  return Math.min(freeCap, creep.store[info.resType]);
}

Creep.prototype.giveResource2 = function(sinks: DemandItem[]): number {
  if (getUsedCapacity(this.store) === 0) {
    return NOTHING_TO_DO;
  }

  let visibles: DemandItem[] = [];
  let invisibles: DemandItem[] = [];
  for (let item of sinks) {
    if (getMyStore(this, item.resType) === 0) {
      continue;
    }
    let obj = item.obj instanceof RoomObject ? item.obj : Game.getObjectById(item.obj.id);
    if (obj) {
      if (getTargetFreeCapacity(obj, item.resType) > 0) {
        visibles.push(item);
      }
    } else if (item.roomName) {
      invisibles.push(item);
    }
  }

  for (let item of visibles) {
    if (this.pos.isNearTo(item.obj as RoomObject)) {
      if (this._worked) return BLOCKED;
      giveResourceToTarget(this, item);
      this._worked = true;
      // this.say('trywk');
      return OK;
    }
  }

  let moveTargets = (visibles.map(item => item.obj) as (RoomObject | BlindObject)[])
      .concat(invisibles.map(item => ({id: item.obj.id, roomName: item.roomName})));
  if (moveTargets.length > 0) {
    if (this._moved) return BLOCKED;
    this.driveToAny(moveTargets, {range: 1});
    this._moved = true;
    return OK;
  }
  return NOTHING_TO_DO;
}
