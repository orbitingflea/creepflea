/**
 * Creep.giveResource(targets, resourceType = 'energy', moveOnly = false);
 * @param targets: 容器，lab；RoomObject / Id / BlindObject, or array of them
 * @param resourceType
 * @param moveOnly
 * @returns
 * - OK
 * - NOTHING_TO_DO
 * - COMPLETE_WITHOUT_MOVE
 */

import { ensureArray } from "lib/utils";

Creep.prototype.giveResource = function(
  targets: RoomObject | Id<RoomObject> | BlindObject | (RoomObject | Id<RoomObject> | BlindObject)[],
  resource: ResourceConstant | 'all',
  moveOnly: boolean = false
): number {
  // use _giveResource
  let list: BlindObject[] = ensureArray(targets).map(item => {
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
  return this._giveResource(list, resource, moveOnly);
}

// if invalid, return 0
function getTargetFreeCapacity(target: RoomObject, resource: ResourceConstant | 'all'): number {
  if (!(target instanceof Structure) || !target.store) {
    return 0;
  }
  if (resource === 'all') {
    return target.store.getFreeCapacity();
  } else {
    return target.store.getFreeCapacity(resource);
  }
}

function getMyStore(creep: Creep, resource: ResourceConstant | 'all'): number {
  if (resource === 'all') {
    return creep.store.getUsedCapacity();
  } else {
    return creep.store[resource];
  }
}

// return predicted transfer amount
function giveResourceToTarget(creep: Creep, target: Structure, resource: ResourceConstant | 'all'): number {
  let freeCap = getTargetFreeCapacity(target, resource);
  if (resource === 'all') {
    for (let r in creep.store) {
      creep.transfer(target, r as ResourceConstant);
      return Math.min(freeCap, creep.store[r as ResourceConstant]);
    }
    return 0;
  } else {
    creep.transfer(target, resource);
    return Math.min(freeCap, creep.store[resource]);
  }
}

Creep.prototype._giveResource = function(targets: BlindObject[], resource: ResourceConstant | 'all', moveOnly: boolean): number {
  if (!moveOnly && getMyStore(this, resource) === 0) {
    return NOTHING_TO_DO;
  }

  let visibleTargets: Structure[] = [];
  let invisibleTargets: BlindObject[] = [];
  for (let item of targets) {
    let obj = Game.getObjectById(item.id);
    if (obj) {
      if (getTargetFreeCapacity(obj, resource) > 0) {
        visibleTargets.push(obj as Structure);
      }
    } else if (item.roomName) {
      invisibleTargets.push(item);
    }
  }

  let givenId: null | Id<Structure> = null;
  let runOut = false;
  let getFull = false;
  if (!moveOnly) {
    for (let target of visibleTargets) {
      if (this.pos.isNearTo(target)) {
        let res = giveResourceToTarget(this, target, resource);
        givenId = target.id;
        getFull = getTargetFreeCapacity(target, resource) === res;
        runOut = res === getMyStore(this, resource);
        break;
      }
    }
  }

  if (givenId) {
    if (runOut) {
      return COMPLETE_WITHOUT_MOVE;
    } else if (!getFull) {
      return OK;
    }
    // else continue
  }

  let moveTargets = (visibleTargets as (RoomObject | BlindObject)[]).filter(s => s.id !== givenId).concat(invisibleTargets);
  if (moveTargets.length > 0) {
    this.driveToAny(moveTargets, {range: 1});
    return OK;
  } else {
    return givenId ? COMPLETE_WITHOUT_MOVE : NOTHING_TO_DO;
  }
}
