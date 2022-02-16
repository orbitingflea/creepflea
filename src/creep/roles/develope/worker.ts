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
  let ret = creep.takeResource(args.sources, RESOURCE_ENERGY, moveOnly);
  return ret;
}

function workMode(creep: Creep, args: WorkerArgs, moveOnly: boolean) {
  //console.log(`[DEBUG] worker ${creep.name}: ${JSON.stringify(args.tasks)}`);
  let ret = creep.runWorkerTasks(args.tasks, moveOnly);
  return ret;
}

function waitMode(creep: Creep, args: WorkerArgs, moveOnly: boolean) {
  creep.park();
  return OK;
}

export default dfaSourceWork({
  source: sourceMode,
  work: workMode,
  wait: waitMode,
});
