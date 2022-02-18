import { ensureArray } from "lib/utils";
import dfaSourceWork from "../utils/dfaSourceWork";

function sourceMode(creep: Creep, args: CarrierArgs, moveOnly: boolean) {
  // console.log(`room ${creep.room.name}`);
  // for (let type in args.sources) {
  //   console.log(`source type ${type}: ${ensureArray(args.sources[type as ResourceConstant | 'all']).length}`);
  // }
  // for (let type in args.sinks) {
  //   console.log(`sink type ${type}: ${ensureArray(args.sinks[type as ResourceConstant | 'all']).length}`);
  // }

  if (args.deathBehavior && creep.ticksToLive! <= args.deathBehavior.threshold) {
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
  if (args.deathBehavior && creep.ticksToLive! <= args.deathBehavior.threshold) {
    return GIVE_UP;
  }
  for (let res in creep.store) {
    if (creep.store[res as ResourceConstant] > 0) {
      let sink = ensureArray(args.sinks[res as ResourceConstant | 'all']);
      if (sink.length > 0) {
        return creep.giveResource(sink, res as ResourceConstant | 'all', moveOnly);
      }
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

function deathMode(creep: Creep, args: CarrierArgs) {
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
