/**
 * 单状态函数的返回值应该是 NOTHING_TO_DO, OK, BLOCKED
 * 用 creep._worked, creep._moved 来控制
 *
 * 死亡由 args.deathBehavior.threshold 控制
 */

import { defaultDeathBehavior } from "./deathBehavior";

function RepeatCall<ArgType>(fun: (creep: Creep, args: ArgType) => number, creep: Creep, args: ArgType): number {
  const MAX_REPEAT = 3;
  for (let i = 0; i < MAX_REPEAT; ++i) {
    const result = fun(creep, args);
    if (result !== OK) return result;
  }
  return BLOCKED;
}

export default function dfaSourceWork2<ArgType>(
  data: {
    source: (creep: Creep, args: ArgType) => number,
    work: (creep: Creep, args: ArgType) => number,
    prepare?: (creep: Creep, args: ArgType) => number,
    wait?: (creep: Creep, args: ArgType) => number,
    death?: (creep: Creep, args: ArgType) => number,
  }
): CreepRole {
  return ((args: ArgType) => (creep: Creep) => {
    if (data.prepare) {
      if (!creep.memory.ready) {
        let ret = RepeatCall(data.prepare, creep, args);
        if (ret === NOTHING_TO_DO) {
          creep.memory.ready = true;
        } else if (ret === BLOCKED) {
          return;
        }
      }
    }

    let deathBehavior = (args as any).deathBehavior || defaultDeathBehavior(creep);
    if (data.death) {
      if (creep.ticksToLive && creep.ticksToLive <= deathBehavior.threshold) {
        creep.memory.dying = 1;
      }
      if (creep.memory.dying) {
        RepeatCall(data.death, creep, args);
        return;
      }
    }

    // run first state
    let func = [data.source, data.work];
    let state = creep.memory.working || 0;
    let ret = RepeatCall(func[state], creep, args);
    if (ret === BLOCKED) {
      creep.say(`block ${state}`);
      return;
    }

    // change state, run second state
    let ret2 = RepeatCall(func[1 ^ state], creep, args);
    if (ret2 === BLOCKED) {
      creep.say(`block ${1 ^ state}`);
      creep.memory.working = 1 ^ state;
    } else {
      creep.memory.working = 1;
      if (data.wait) {
        RepeatCall(data.wait, creep, args);
      }
    }
  }) as CreepRole;
}
