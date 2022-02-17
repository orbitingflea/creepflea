/**
 * WorkerArgs 包含一个 source 列表和一个 task 列表。
 * TODO
 * - room danger 打断。朝什么地方撤退？
 * - lair danger 打断。
 * - 死亡预警：快死了就不要拿取资源了，而是准备自杀。
 */

import { ensureArray } from "lib/utils";
import dfaSourceWork from "../utils/dfaSourceWork";

function sourceMode(creep: Creep, args: WorkerArgs, moveOnly: boolean) {
  if (args.deathBehavior && creep.ticksToLive! <= args.deathBehavior.threshold) {
    return GIVE_UP;
  }
  let ret = creep.takeResource(args.sources, RESOURCE_ENERGY, moveOnly);
  return ret;
}

function workMode(creep: Creep, args: WorkerArgs, moveOnly: boolean) {
  if (args.deathBehavior && creep.ticksToLive! <= args.deathBehavior.threshold) {
    return GIVE_UP;
  }
  let ret = creep.runWorkerTasks(args.tasks, moveOnly);
  return ret;
}

function waitMode(creep: Creep, args: WorkerArgs, moveOnly: boolean) {
  creep.park();
  return OK;
}

function deathMode(creep: Creep, args: WorkerArgs) {
  let deathBehavior = args.deathBehavior!;
  if (deathBehavior.action === 'save') {
    let obj = Game.getObjectById(deathBehavior.saveId!);
    if (obj) {
      if (!creep.pos.isNearTo(obj)) {
        creep.driveTo(obj, {range: 1});
        return OK;
      }
      if (obj.store!.getFreeCapacity() === 0) {
        creep.driveTo(obj, {range: 1, offRoad: true});
        return OK;
      }
      for (let res in creep.store) {
        if (creep.store[res as ResourceConstant] > 0) {
          creep.transfer(obj, res as ResourceConstant);
          return OK;
        }
      }
      creep.suicide();
      return OK;
    }
  }

  creep.park();
  return OK;
}

export default dfaSourceWork({
  source: sourceMode,
  work: workMode,
  wait: waitMode,
  death: deathMode,
});
