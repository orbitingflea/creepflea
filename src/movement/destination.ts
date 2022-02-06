/**
 * 本文件实现了 Destination 的相关功能，用 interface Destination 来给出目标附近的 filter，
 * 在 creep 已经到达目标附近时提供最后几步 fine tune 的行为。
 */

import { Rectangle } from 'lib/rectangle';
import { ensureArray } from 'lib/utils';
import { callback } from './callback';

const MAX_PARK_RANGE = 7;

RoomPosition.prototype.matchDestination = function(dest: Destination): boolean {
  let distance = this.getRangeTo(dest.pos);
  if (distance > dest.range) {
    return false;
  }
  if (dest.dangerAttitude === undefined || dest.dangerAttitude === 'avoid') {
    if (global.roomDanger(this.roomName)) {
      return false;
    }
  }
  if (dest.keeperAttitude === undefined || dest.keeperAttitude === 'avoid') {
    if (this.inActiveLairRegion) {
      return false;
    }
  }
  if (dest.rangeMin !== undefined && distance < dest.rangeMin) {
    return false;
  }
  if (dest.offRoad && !this.parkable) {
    return false;
  }
  return true;
}

export function findPathOffRoad(origin: RoomPosition, dest: Destination, opts: FindPathMyOpts): FindPathMyResult {
  // 调用这一函数的时候，origin 必须满足除了 offRoad 以外的所有条件，且 origin.parkable === false。
  let roomCallback = callback(origin, dest.pos, opts);
  let optsFinder = {
    plainCost: 2,
    swampCost: 10,
    roomCallback: roomCallback,
  };
  if (opts.ignoreRoads === true) {
    optsFinder.plainCost = 1;
    optsFinder.swampCost = 5;
  }
  for (let d = 1; d <= MAX_PARK_RANGE; ++d) {
    let xl = Math.max(origin.x - d, 1);
    let xr = Math.min(origin.x + d, 48);
    let yl = Math.max(origin.y - d, 1);
    let yr = Math.min(origin.y + d, 48);
    let rect = new Rectangle(xl, xr, yl, yr, origin.roomName);
    let points = rect.boundary.filter(
      p => p.matchDestination(dest) && !p.underCreep
    );
    if (points.length > 0) {
      let result = PathFinder.search(
        origin,
        points.map(p => ({pos: p, range: 0})),
        optsFinder
      );
      return {
        path: result.path,
        incomplete: result.incomplete,
        cost: result.cost * (opts.ignoreRoads ? 2 : 1),
        firstInvisibleRoom: null
      };
    }
  }
  // fail
  console.log(`[WARN] findPathOffRoad failed,
- origin: ${origin},
- dest: ${JSON.stringify(dest)},
- cannot find park point.`);
  return {
    path: [],
    incomplete: true,
    cost: 0,
    firstInvisibleRoom: null
  };
}

export function encodeDestination(dest: Destination): string {
  return dest.pos.code + '#' + dest.range + '#' + dest.rangeMin +
    '#' + (dest.offRoad ? '1' : '0') + '#' + dest.keeperAttitude + '#' + dest.dangerAttitude;
}

export function decodeDestination(code: string): Destination {
  let [posCode, range, rangeMin, offRoad, keeperAttitude, dangerAttitude] = code.split('#');
  return {
    pos: decodeRoomPosition(posCode),
    range: parseInt(range),
    rangeMin: parseInt(rangeMin),
    offRoad: offRoad === '1',
    keeperAttitude: keeperAttitude,
    dangerAttitude: dangerAttitude
  };
}

// does not encode blocking, because blocking cannot be specified by parameters
export function encodeFindPathOpts(opts: FindPathMyOpts): string {
  let avoidStr = '';
  for (let p of ensureArray(opts.avoid)) {
    avoidStr += p.code + ';';
  }
  return opts.keeperAttitude + '#' + opts.dangerAttitude + '#' +
    (opts.ignoreRoads ? '1' : '0') + '#' + (opts.singleRoom ? '1' : '0') +
    '#' + avoidStr;
}

export function decodeFindPathOpts(code: string): FindPathMyOpts {
  let [keeperAttitude, dangerAttitude, ignoreRoads, singleRoom, avoidStr] = code.split('#');
  let avoid = [];
  for (let p of avoidStr.split(';')) {
    if (p.length > 0) {
      avoid.push(decodeRoomPosition(p));
    }
  }
  return {
    keeperAttitude: keeperAttitude,
    dangerAttitude: dangerAttitude,
    ignoreRoads: ignoreRoads === '1',
    singleRoom: singleRoom === '1',
    avoid: avoid
  };
}
