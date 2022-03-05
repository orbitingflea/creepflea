import { ensureArray } from "lib/utils";
import dfaSourceWork2 from "../utils/dfaSourceWork2";
import { defaultDeathBehavior, deathMode } from '../utils/deathBehavior';

function sourceMode(creep: Creep, args: CarrierArgs2) {
  // decide which resource to take
  let sources = ensureArray(args.sources);
  if (sources.length === 0) return NOTHING_TO_DO;
  if (creep.store.getFreeCapacity() === 0) return NOTHING_TO_DO;

  let topPriority = _.max(sources.map(item => item.priority || 0));
  sources = sources.filter(item => (item.priority || 0) === topPriority);
  let result = creep.takeResource2(sources);
  return result;
}

function workMode(creep: Creep, args: CarrierArgs2) {
  let deathBehavior = args.deathBehavior || defaultDeathBehavior(creep);
  if (creep.ticksToLive! <= deathBehavior.threshold) {
    return GIVE_UP;
  }

  let sinks = ensureArray(args.sinks).filter(item => creep.store[item.resType] > 0);
  if (sinks.length === 0) return NOTHING_TO_DO;

  let topPriority = _.max(sinks.map(item => item.priority || 0));
  sinks = sinks.filter(item => (item.priority || 0) === topPriority);
  let result = creep.giveResource2(sinks);
  return result;
}

function waitMode(creep: Creep, args: CarrierArgs2) {
  creep.park();
  return OK;
}

export default dfaSourceWork2({
  source: sourceMode,
  work: workMode,
  wait: waitMode,
  death: deathMode,
});
