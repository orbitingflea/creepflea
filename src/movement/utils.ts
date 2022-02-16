import { translateDriveOpts } from './main';
import { decodeDestination, decodeFindPathOpts } from './destination';

/**
 * 本文件围绕 driveTo 的基本功能，定义了一些方便使用的函数。
 */

Creep.prototype.park = function(): number {
  if (this.pos.parkable) {
    return 1;
  } else {
    return this.driveTo(new RoomPosition(25, 25, this.room.name), {range: 25, offRoad: true});
  }
}

Creep.prototype.driveBlind = function(object: RoomObject | undefined, roomName: string, opts: DriveToOpts = {}): number {
  if (object) {
    return this.driveTo(object, opts);
  }
  let driveInfo = this.cache.driveInfo;
  if (driveInfo) {
    let dest = decodeDestination(driveInfo.destCode);
    let fpOpts = decodeFindPathOpts(driveInfo.optsCode);
    return this._drive(dest, fpOpts);
  } else {
    return this.driveTo(new RoomPosition(25, 25, roomName), {range: 25});
  }
}

Creep.prototype.driveAhead = function(): number {
  let driveInfo = this.cache.driveInfo;
  if (driveInfo) {
    let dest = decodeDestination(driveInfo.destCode);
    let fpOpts = decodeFindPathOpts(driveInfo.optsCode);
    return this._drive(dest, fpOpts);
  } else {
    return ERR_INVALID_TARGET;
  }
}

// --- driveToAny: 用 range 来估计最近的目标，并支持多房间与无视野情况 ---

function estimateRange(from: RoomPosition, to: RoomObject | Id<RoomObject> | BlindObject): number {
  if (to instanceof RoomObject) {
    return from.wGetRangeTo(to);
  } else if (typeof to === 'string') {
    let obj = Game.getObjectById(to);
    if (obj) {
      return from.wGetRangeTo(obj);
    } else {
      return Infinity;
    }
  } else {
    let obj = Game.getObjectById(to.id);
    if (obj) {
      return from.wGetRangeTo(obj);
    } else if (to.roomName) {
      return from.wGetRangeTo(new RoomPosition(25, 25, to.roomName)) + 25;
    } else {
      return Infinity;
    }
  }
}

function getTargetId(target: RoomObject | Id<RoomObject> | BlindObject): Id<RoomObject> {
  if (target instanceof RoomObject) {
    return target.id;
  } else if (typeof target === 'string') {
    return target;
  } else {
    return target.id;
  }
}

function driveToAnyTranslated(creep: Creep, target: RoomObject | Id<RoomObject> | BlindObject, opts: DriveToOpts): number {
  if (target instanceof RoomObject) {
    return creep.driveTo(target, opts);
  }
  let id = getTargetId(target);
  let obj = Game.getObjectById(id);
  if (obj) {
    return creep.driveTo(obj, opts);
  }
  if (typeof target === 'object' && target.roomName) {
    return creep.driveTo(new RoomPosition(25, 25, target.roomName), {
      range: 25,
      keeperAttitude: opts.keeperAttitude,
      dangerAttitude: opts.dangerAttitude,
      ignoreRoads: opts.ignoreRoads,
      singleRoom: opts.singleRoom,
      avoid: opts.avoid,
    });
  }
  return ERR_INVALID_TARGET;
}

const DRIVE_TO_ANY_INFO_TTL = 3;

Creep.prototype.driveToAny = function(targets: (RoomObject | Id<RoomObject> | BlindObject)[], opts: DriveToOpts = {}): number {
  // step 1: find nearest in targets
  // step 2: compare to cache, check if replace
  // step 3: driveTo cache

  type Target = RoomObject | Id<RoomObject> | BlindObject;
  let closestTarget: null | Target = null;
  let closestRange = Infinity;
  for (let target of targets) {
    let range = estimateRange(this.pos, target);
    if (range < closestRange) {
      closestTarget = target;
      closestRange = range;
    }
  }

  let cacheBetter = false;
  let cacheTarget: null | Target = null;
  if (this.cache.driveToAnyInfo) {
    const info = this.cache.driveToAnyInfo;
    if (info.lastUpdate >= Game.time - DRIVE_TO_ANY_INFO_TTL) {
      let cacheId = info.targetId;
      for (let target of targets) {
        if (getTargetId(target) === cacheId) {
          cacheTarget = target;
          break;
        }
      }
      if (cacheTarget) {
        let nowRange = estimateRange(this.pos, cacheTarget);
        if (nowRange < info.minRange) {
          info.minRange = nowRange;
        }
        if (info.minRange <= closestRange) {
          cacheBetter = true;
          info.lastUpdate = Game.time;
        }
      }
    }
  }

  if (!cacheBetter) {
    if (closestTarget) {
      this.cache.driveToAnyInfo = {
        targetId: getTargetId(closestTarget),
        minRange: closestRange,
        lastUpdate: Game.time,
      };
      return driveToAnyTranslated(this, closestTarget, opts);
    } else {
      console.log(`[ERROR] driveToAny: no target found. creep: ${this.name}.`);
      return ERR_INVALID_TARGET;
    }
  } else {
    return driveToAnyTranslated(this, cacheTarget!, opts);
  }
}
