/**
 * 本文件定义了以 source, work 双状态来回切换为主要过程的 creep 工作逻辑。
 *
 * TODO death?
 */

export default function dfaSourceWork<ArgType>(
  data: {
    source: (creep: Creep, args: ArgType, moveOnly: boolean) => number,
    work: (creep: Creep, args: ArgType, moveOnly: boolean) => number,
    prepare?: (creep: Creep, args: ArgType) => number,
    wait?: (creep: Creep, args: ArgType, moveOnly: boolean) => number,
    death?: (creep: Creep, args: ArgType) => number,
  }
): CreepRole {
  return ((args: ArgType) => (creep: Creep) => {
    let moveOnly = false;

    if (data.prepare) {
      if (!creep.memory.ready) {
        let ret = data.prepare(creep, args);
        if (ret === NOTHING_TO_DO) {
          creep.memory.ready = true;
        } else if (ret === COMPLETE_WITHOUT_MOVE) {
          creep.memory.ready = true;
          moveOnly = true;
        }
        return;
      }
    }

    if (data.death && creep.memory.dying) {
      data.death(creep, args);
      return;
    }

    let func = [
      data.source,
      data.work,
    ];
    let state = creep.memory.working || 0;
    let ret = func[state](creep, args, moveOnly);
    switch (ret) {
    case OK:
      return;
    case NOTHING_TO_DO:
      break;
    case COMPLETE_WITHOUT_MOVE:
      moveOnly = true;
      break;
    case GIVE_UP:
      creep.memory.dying = 1;
      if (data.death) {
        data.death(creep, args);
        return;
      }
      break;
    }

    // change state, run new state
    let ret2 = func[1 ^ state](creep, args, moveOnly);
    switch (ret2) {
    case OK:
      creep.memory.working = 1 ^ state;
      break;
    case NOTHING_TO_DO:
      creep.memory.working = 1;
      if (data.wait) data.wait(creep, args, moveOnly);
      break;
    case COMPLETE_WITHOUT_MOVE:
      creep.memory.working = state;
      break;
    case GIVE_UP:
      creep.memory.dying = 1;
      if (data.death) {
        data.death(creep, args);
        return;
      }
      break;
    }
  }) as CreepRole;
}
