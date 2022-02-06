/**
 * 本文件致力于找到前往 HeuristicDestination 的路径，依赖于 callback。
 * 针对 opts.ignoreRoads 属性，将灵活地设置平原和道路的代价。
 */

import { callback } from './callback';

function firstInvisibleRoom(path: RoomPosition[]) {
  for (let pos of path) {
    if (!pos.visible) {
      return pos.roomName;
    }
  }
  return null;
}

export function findPath(origin: RoomPosition, destination: HeuristicDestination, opts: FindPathMyOpts): FindPathMyResult {
  let roomCallback = callback(origin, destination.pos, opts);
  // console.log(`[DEBUG] costmatrix ${JSON.stringify(roomCallback('E38S45'))}`);
  // console.log(`[DEBUG] ${roomCallback(origin.roomName)}, ${roomCallback(destination.pos.roomName)}, ${roomCallback('E38S45')}`);
  let optsFinder = {
    plainCost: 2,
    swampCost: 10,
    roomCallback: roomCallback,
    flee: destination.flee,
  };
  if (opts.ignoreRoads === true) {
    optsFinder.plainCost = 1;
    optsFinder.swampCost = 5;
  }
  let result = PathFinder.search(origin, {pos: destination.pos, range: destination.range}, optsFinder);
  // console.log(`[DEBUG] result path len ${result.path.length}`);
  return {
    path: result.path,
    incomplete: result.incomplete,
    cost: result.cost * (opts.ignoreRoads ? 2 : 1),
    firstInvisibleRoom: firstInvisibleRoom(result.path),
  };
}

export function findPathLeaveLairRegion(origin: RoomPosition, opts: FindPathMyOpts): FindPathMyResult {
  let roomCallback = callback(origin, null, opts);
  let rect = origin.lairRegion?.shape;
  if (!rect) {
    console.log(`[ERROR] findPathLeaveLairRegion is called wrongly,
- origin: ${origin},
- opts: ${JSON.stringify(opts)},
- origin does not have lair region.`);
    return {
      path: [],
      incomplete: true,
      cost: 0,
      firstInvisibleRoom: null,
    };
  }
  let optsFinder = {
    plainCost: 2,
    swampCost: 10,
    roomCallback: roomCallback,
    flee: true,
  };
  if (opts.ignoreRoads === true) {
    optsFinder.plainCost = 1;
    optsFinder.swampCost = 5;
  }
  let cover = rect.getPosRangeCover().map(pair => ({
    pos: pair.pos,
    range: pair.range + 1
  }));
  let result = PathFinder.search(origin, cover, optsFinder);
  return {
    path: result.path,
    incomplete: result.incomplete,
    cost: result.cost * (opts.ignoreRoads ? 2 : 1),
    firstInvisibleRoom: firstInvisibleRoom(result.path)
  };
}
