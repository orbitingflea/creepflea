import { ensureArray } from "lib/utils";
import dfaSourceWork from "../utils/dfaSourceWork";
import { defaultDeathBehavior, deathMode } from '../utils/deathBehavior';

function sourceMode(creep: Creep, args: CarrierArgs, moveOnly: boolean) {
  let deathBehavior = args.deathBehavior || defaultDeathBehavior(creep);
  if (creep.ticksToLive! <= deathBehavior.threshold) {
    return GIVE_UP;
  }
  // decide which resource to take
  for (let res in args.sources) {
    let source = ensureArray(args.sources[res as ResourceConstant | 'all']);
    if (source.length > 0) {
      let ret = creep.takeResource(source, res as ResourceConstant | 'all', moveOnly);
      return ret;
    }
  }
  return NOTHING_TO_DO;
}

function workMode(creep: Creep, args: CarrierArgs, moveOnly: boolean) {
  let deathBehavior = args.deathBehavior || defaultDeathBehavior(creep);
  if (creep.ticksToLive! <= deathBehavior.threshold) {
    return GIVE_UP;
  }
  for (let res in creep.store) {
    let sink = ensureArray(args.sinks[res as ResourceConstant | 'all']);
    if (sink.length > 0) {
      return creep.giveResource(sink, res as ResourceConstant | 'all', moveOnly);
    }
  }
  // res === all
  let sink = ensureArray(args.sinks['all']);
  if (sink.length > 0) {
    return creep.giveResource(sink, 'all', moveOnly);
  }
  return NOTHING_TO_DO;
}

function waitMode(creep: Creep, args: CarrierArgs, moveOnly: boolean) {
  creep.park();
  return OK;
}

export default dfaSourceWork({
  source: sourceMode,
  work: workMode,
  wait: waitMode,
  death: deathMode,
});
