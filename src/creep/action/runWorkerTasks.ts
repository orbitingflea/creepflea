/**
 * Creep.runWorkerTasks(tasks, moveOnly);
 * @param tasks: WorkerTask[]
 * @param moveOnly = false
 * @returns
 * - OK
 * - NOTHING_TO_DO
 * - COMPLETE_WITHOUT_MOVE
 */

import { ensureArray } from "lib/utils";

Creep.prototype.runWorkerTasks = function(
  tasks: WorkerTask | WorkerTask[],
  moveOnly: boolean = false
): number {
  return this._runWorkerTasks(ensureArray(tasks), moveOnly);
}

function isValidTask(obj: RoomObject, action: 'repair' | 'build' | 'upgrade'): boolean {
  switch (action) {
    case 'repair':
      return obj instanceof Structure && obj.hits < obj.hitsMax && !obj.isHostile;
    case 'build':
      return obj instanceof ConstructionSite && obj.my;
    case 'upgrade':
      return obj instanceof StructureController && obj.my;
  }
}

// return [isDone, isEmpty]
function doWorkerTask(creep: Creep, obj: RoomObject, action: 'repair' | 'build' | 'upgrade'): [boolean, boolean] {
  let nWorks = creep.getActiveBodyparts(WORK);
  let energy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
  switch (action) {
    case 'repair': {
      creep.repair(obj as Structure);
      let amount = (obj as Structure).hitsMax - (obj as Structure).hits;
      let ability = Math.min(nWorks, energy);
      let used = Math.min(Math.ceil(amount * REPAIR_COST), ability);
      return [ability * REPAIR_POWER >= amount, used === energy];
    }
    case 'build': {
      creep.build(obj as ConstructionSite);
      let amount = (obj as ConstructionSite).progressTotal - (obj as ConstructionSite).progress;
      let ability = Math.min(nWorks * BUILD_POWER, energy);
      let used = Math.min(amount, ability);
      return [ability >= amount, used === energy];
    }
    case 'upgrade': {
      creep.upgradeController(obj as StructureController);
      return [false, nWorks >= energy];
    }
  }
}

Creep.prototype._runWorkerTasks = function(tasks: WorkerTask[], moveOnly: boolean): number {
  if (this.store[RESOURCE_ENERGY] === 0 && !moveOnly) {  // moveOnly means this tick has other actions, like withdraw
    return NOTHING_TO_DO;
  }

  let maxPriority = _.max(tasks, task => task.priority).priority;

  let visibleTasks: WorkerTask[] = [];
  let invisibleTasks: WorkerTask[] = [];
  for (let task of tasks.filter(task => task.priority === maxPriority)) {
    let obj = Game.getObjectById(task.id);
    if (obj) {
      if (isValidTask(obj, task.action)) {
        visibleTasks.push(task);
      }
    } else if (task.roomName && !Game.rooms[task.roomName]) {
      invisibleTasks.push(task);
    }
  }

  let getDone = false;
  let getEmpty = false;
  let workedId: null | Id<RoomObject> = null;
  if (!moveOnly) {
    for (let task of visibleTasks) {
      let obj = Game.getObjectById(task.id)!;
      if (this.pos.inRangeTo(obj, 3)) {
        [getDone, getEmpty] = doWorkerTask(this, obj, task.action);
        workedId = task.id;
        break;
      }
    }
  }

  if (workedId) {
    if (getEmpty) {
      return COMPLETE_WITHOUT_MOVE;
    }
    if (getDone) {
      // 走向下一个工作地点
    } else {
      // 寻找停车位置
      if (this.pos.parkable) return OK;
      let res = this.driveTo(Game.getObjectById(workedId)!, {range: 3, offRoad: true});
      if (res === OK) {
        return OK;
      } else if (res === ERR_NO_PARKABLE_POS) {
        return OK;
      }
    }
  }

  let moveTargets = (visibleTasks.map(task => Game.getObjectById(task.id)!) as (RoomObject | BlindObject)[])
      .filter(s => s.id !== workedId)
      .concat(invisibleTasks.map(task => ({
        id: task.id,
        roomName: task.roomName
      })));
  if (moveTargets.length > 0) {
    this.driveToAny(moveTargets, {range: 3, offRoad: true});
    return OK;
  } else {
    return workedId ? COMPLETE_WITHOUT_MOVE : NOTHING_TO_DO;
  }
}
