import { findPath, findPathLeaveLairRegion } from './findPath';
import { findPathOffRoad, encodeDestination, encodeFindPathOpts } from './destination';

/**
 * 本文件是移动模块的核心，提供基本的函数 driveTo，传入 destination position 和 DriveOpts，自动完成缓存、寻路等等操作。
 * 第一阶段：决定是否重新寻路，把 creep.cache.driveInfo 设置为正确的路径
 * 第二阶段：沿着这条路走一步
 *
 * TO BE FIXED: avoid 在 destination 中没有出现，但在寻路参数中出现了。有可能会出现问题。
 * 将来如果要使用 avoid，必须仔细审视这一情况。
 */

const MAX_PATIENCE = 3;

function removePathPrefix(path: RoomPosition[], pos: RoomPosition): RoomPosition[] {
  if (path.length === 0) return path;
  let n = Math.min(3, path.length);
  for (let i = 0; i < n; ++i) {
    if (path[i].isEqualTo(pos)) {
      path.splice(0, i + 1);
      return path;
    }
  }
  return path;
}

Creep.prototype._drive = function(destination: Destination, opts: FindPathMyOpts): number {
  if (!this.my) return ERR_NOT_OWNER;
  if (this.fatigue > 0) return ERR_TIRED;
  if (this.spawning) return ERR_BUSY;

  let matchCache = true;
  let blocking = 0;
  let destCode = encodeDestination(destination);
  let optsCode = encodeFindPathOpts(opts);
  let driveInfo = this.cache.driveInfo;
  if (driveInfo === undefined || driveInfo.destCode !== destCode || driveInfo.optsCode !== optsCode) {
    matchCache = false;
  } else if (driveInfo.firstInvisibleRoom !== null && Game.rooms[driveInfo.firstInvisibleRoom]) {
    // 有视野了，重新寻路
    matchCache = false;
  } else {
    // 计算耐心
    removePathPrefix(driveInfo.path, this.pos);
    if (driveInfo.path.length === 0) {
      matchCache = false;
    } else if (driveInfo.path.length < driveInfo.lastPathLength) {
      driveInfo.patience = 0;
      driveInfo.lastPathLength = driveInfo.path.length;
    } else if (++driveInfo.patience >= MAX_PATIENCE) {
      matchCache = false;
      let blockingPos = driveInfo.path[0];
      if (blockingPos.visible && blockingPos.parkable) {
        blocking = 1;
      } else {
        blocking = 2;  // road blocking
      }
    }
  }

  if (matchCache) {
    let target = (driveInfo as DriveInfo).path[0];
    return this.move(this.pos.getDirectionTo(target));
  }

  opts.blocking = blocking;
  delete this.cache.driveInfo;

  // 需要重新计算
  let dist = this.pos.getRangeTo(destination.pos);
  let result;
  if (opts.keeperAttitude === 'avoid' && this.pos.inActiveLairRegion) {
    result = findPathLeaveLairRegion(this.pos, opts);
  } else if (dist > destination.range) {
    result = findPath(this.pos, {
      pos: destination.pos,
      range: destination.range,
      flee: false,
    }, opts);
  } else if (dist < destination.rangeMin) {
    result = findPath(this.pos, {
      pos: destination.pos,
      range: destination.rangeMin,
      flee: true,
    }, opts);
  } else if (destination.offRoad && !this.pos.parkable) {
    result = findPathOffRoad(this.pos, destination, opts);
    if (result.incomplete) {
      return ERR_NO_PARKABLE_POS;
    }
  } else {
    // already reached destination
    return 1;
  }

  removePathPrefix(result.path, this.pos);
  // if (result.incomplete) {
  //   console.log(`[WARN] ${this.name} drive: incomplete path
  // - drive from ${this.pos} to ${destination.pos}, opts: ${JSON.stringify(opts)}
  // - dest: ${JSON.stringify(destination)}
  // - path: ${JSON.stringify(result.path)}`);
  // }
  if (result.path.length === 0) {
    return ERR_NO_PATH;
  }

  this.cache.driveInfo = {
    destCode,
    optsCode,
    path: result.path,
    firstInvisibleRoom: result.firstInvisibleRoom,
    lastPathLength: result.path.length,
    patience: 0,
  };
  let target = this.cache.driveInfo.path[0];
  return this.move(this.pos.getDirectionTo(target));
}

Creep.prototype.driveTo = function(destination: RoomPosition | RoomObject, opts: DriveToOpts = {}): number {
  let [dest, findPathOpts] = translateDriveOpts(destination, opts);
  if (this.pos.matchDestination(dest)) {
    return 1;
  } else {
    let cpuStart = Game.cpu.getUsed();
    let foo = this._drive(dest, findPathOpts);
    const THRESHOLD = 0.5;
  //   if (Game.cpu.getUsed() - cpuStart >= THRESHOLD) {
  //     console.log(`[WARN] driveTo too slow, used ${Game.cpu.getUsed() - cpuStart} CPU
  // - creep: ${this.name}
  // - destination: ${JSON.stringify(dest)}
  // - findPathOpts: ${JSON.stringify(findPathOpts)}`);
  //   }
    return foo;
  }
}

export function translateDriveOpts(destination: RoomPosition | RoomObject, opts: DriveToOpts): [Destination, FindPathMyOpts] {
  let dest: Destination = {
    pos: destination instanceof RoomPosition ? destination : destination.pos,
    range: opts.range !== undefined ? opts.range : 1,
    rangeMin: opts.rangeMin !== undefined ? opts.rangeMin : 0,
    offRoad: opts.offRoad !== undefined ? opts.offRoad : false,
    keeperAttitude: opts.keeperAttitude !== undefined ? opts.keeperAttitude : 'avoid',
    dangerAttitude: opts.dangerAttitude !== undefined ? opts.dangerAttitude : 'avoid',
  };

  let findPathOpts: FindPathMyOpts = {
    keeperAttitude: opts.keeperAttitude !== undefined ? opts.keeperAttitude : 'avoid',
    dangerAttitude: opts.dangerAttitude !== undefined ? opts.dangerAttitude : 'avoid',
    ignoreRoads: opts.ignoreRoads !== undefined ? opts.ignoreRoads : false,
    singleRoom: opts.singleRoom !== undefined ? opts.singleRoom : true,
    avoid: opts.avoid !== undefined ? opts.avoid : [],
  };

  return [dest, findPathOpts];
}
