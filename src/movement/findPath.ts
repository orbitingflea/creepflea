/**
 * 本文件致力于找到前往 HeuristicDestination 的路径，依赖于 callback。
 * 针对 opts.ignoreRoads 属性，将灵活地设置平原和道路的代价。
 */

import { callback } from './callback';
import { encodeFindPathOpts, encodeHeuristicDestination } from './destination';
import { LRUMap } from 'lib/lru/lru.js';

const CACHE_SIZE = 1000;

global.pathCache = new LRUMap(CACHE_SIZE);

function firstInvisibleRoom(path: RoomPosition[]) {
  for (let pos of path) {
    if (!pos.visible) {
      return pos.roomName;
    }
  }
  return null;
}

export function findPath(origin: RoomPosition, destination: HeuristicDestination, opts: FindPathMyOpts): FindPathMyResult {
  let useCache = (opts.blocking === 0);
  let cacheName;
  if (useCache) {
    cacheName = `A${origin.code}#${encodeHeuristicDestination(destination)}#${encodeFindPathOpts(opts)}}`;
    let cacheValue = global.pathCache.get(cacheName);
    if (cacheValue !== undefined) {
      return cacheValue;
    }
  }
  let roomCallback = callback(origin, destination.pos, opts);
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
  // DEBUG begin
  let cpuStart = Game.cpu.getUsed();
  let result = PathFinder.search(origin, {pos: destination.pos, range: destination.range}, optsFinder);
  let cpuUsed = Game.cpu.getUsed() - cpuStart;
  if (cpuUsed > 0.1) {
    console.log(`findPath use cpu: ${cpuUsed}`);
  }
  // DEBUG end
  let ret: FindPathMyResult = {
    path: result.path,
    incomplete: result.incomplete,
    cost: result.cost * (opts.ignoreRoads ? 2 : 1),
    firstInvisibleRoom: firstInvisibleRoom(result.path),
  };
  if (useCache) {
    global.pathCache.set(cacheName as string, ret);
  }
  return ret;
}

export function findPathLeaveLairRegion(origin: RoomPosition, opts: FindPathMyOpts): FindPathMyResult {
  let useCache = (opts.blocking === 0);
  let cacheName;
  if (useCache) {
    cacheName = `L${origin.code}#${encodeFindPathOpts(opts)}}`;
    let cacheValue = global.pathCache.get(cacheName);
    if (cacheValue !== undefined) {
      return cacheValue;
    }
  }
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
  let ret: FindPathMyResult = {
    path: result.path,
    incomplete: result.incomplete,
    cost: result.cost * (opts.ignoreRoads ? 2 : 1),
    firstInvisibleRoom: firstInvisibleRoom(result.path)
  };
  if (useCache) {
    global.pathCache.set(cacheName as string, ret);
  }
  return ret;
}
