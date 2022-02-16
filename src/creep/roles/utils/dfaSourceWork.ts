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
    // death?: (creep: Creep, args: ArgType, moveOnly: boolean) => number,
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

    let func = [
      data.source,
      data.work,
    ];
    let state = creep.memory.working || 0;
    let ret = func[state](creep, args, moveOnly);
    if (ret === OK) {
      return;
    } else if (ret === NOTHING_TO_DO) {
    } else if (ret === COMPLETE_WITHOUT_MOVE) {
      moveOnly = true;
    }

    // change state, run new state
    let ret2 = func[1 ^ state](creep, args, moveOnly);
    if (ret2 === OK) {
      creep.memory.working = 1 ^ state;
    } else if (ret2 === COMPLETE_WITHOUT_MOVE) {
      creep.memory.working = state;
    } else if (ret2 === NOTHING_TO_DO) {
      creep.memory.working = 1;
      if (data.wait) data.wait(creep, args, moveOnly);
    }
  }) as CreepRole;
}
