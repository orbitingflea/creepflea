export const defaultDeathBehavior = (creep: Creep) => {
  if (creep.room.storage) {
    return {
      action: 'save',
      threshold: 50,
      saveId: creep.room.storage.id
    } as DeathBehavior;
  } else {
    return {
      action: 'none',
      threshold: 0
    } as DeathBehavior;
  }
}

export function deathMode(creep: Creep, args: {deathBehavior?: DeathBehavior}) {
  let deathBehavior = args.deathBehavior || defaultDeathBehavior(creep);
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
