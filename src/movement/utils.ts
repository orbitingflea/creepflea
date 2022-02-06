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
