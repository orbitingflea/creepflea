/**
 * 本文件定义了若干常用的回调函数，且使用 cache service 缓存必要信息。
 * 使用若干修改器来实现回调函数的计算，每个函数都会改变传入的参数，外部应当选择在适合时机 clone。
 * 修改器必须在有视野的时候，传入 room 对象使用。
 */

import { Rectangle } from 'lib/rectangle';
import { ensureArray } from 'lib/utils';

function staticCallback(roomName: string): CostMatrix {
  let cacheName = `callback.static.${roomName}`;
  let room = Game.rooms[roomName];
  let ttl = room ? 200 : Infinity;
  if (global.staticCache.get(cacheName, ttl)) {
    return global.staticCache.get(cacheName) as CostMatrix;
  } else if (!room) {
    return new PathFinder.CostMatrix();
  }

  let matrix = new PathFinder.CostMatrix();
  matrix.considerStructures(room);
  console.log(`[INFO] computing static callback for ${roomName}`);

  global.staticCache.set(cacheName, matrix);
  return matrix;
}

export function callback(origin: RoomPosition, destination: RoomPosition | null, opts: FindPathMyOpts) {
  let roomFilter: ((roomName: string) => boolean)[] = [];
  if (opts.singleRoom) {
    if (destination === null || origin.roomName === destination.roomName) {
      roomFilter.push((roomName: string) => roomName === origin.roomName);
    }
  }
  if (opts.dangerAttitude === 'avoid') {
    roomFilter.push((roomName: string) => roomName === origin.roomName || global.roomDanger(roomName) === null);
  }

  return (roomName: string) => {
    if (roomFilter.some(f => !f(roomName))) return false;
    let room = Game.rooms[roomName];
    let exceptList = [];
    if (origin.roomName === roomName) {
      exceptList.push(origin);
    }
    if (destination && destination.roomName === roomName) {
      if (opts.keeperAttitude === 'passive' || (room && !destination.inActiveLairRegion)) {
        exceptList.push(destination);
      }
    }
    let regionShapes = global.roomLairRegions(roomName).map(info => info.shape);
    let enable = '';
    let enableShapes = [];
    for (let i = 0; i < regionShapes.length; ++i) {
      let curEnable = !exceptList.some(p => regionShapes[i].contains(p));
      if (curEnable) {
        enable += i.toString();
        enableShapes.push(regionShapes[i]);
      }
    }
    let cacheName = `callback.avoidLair.${roomName}.${enable}`;
    let ttl = room ? 200 : Infinity;
    let matrix: CostMatrix;
    if (global.staticCache.get(cacheName, ttl)) {
      matrix = global.staticCache.get(cacheName) as CostMatrix;
    } else {
      matrix = staticCallback(roomName).clone();
      for (let shape of enableShapes) {
        matrix.avoidRectangle(roomName, shape);
      }
      global.staticCache.set(cacheName, matrix);
    }
    // 至此，matrix 中已经包含建筑和 lair region 的信息。
    let cloned = false;
    let avoidPos = ensureArray(opts.avoid);
    if (avoidPos.length > 0) {
      if (!cloned) { matrix = matrix.clone(); cloned = true; }
      matrix.avoidPositions(roomName, avoidPos);
    }
    if (opts.blocking === 1) {
      if (room) {
        if (!cloned) { matrix = matrix.clone(); cloned = true; }
        matrix.avoidNonRoadCreeps(room);
        console.log(`[INFO] normal blocking at ${roomName}`);
      }
    } else if (opts.blocking === 2) {
      if (room) {
        if (!cloned) { matrix = matrix.clone(); cloned = true; }
        matrix.avoidCreeps(room);
        console.log(`[INFO] road blocking at ${roomName}`);
      }
    }
    return matrix;
  };
}

// --------------------
// modifiers below

// road 被置为 1，是否忽略道路由地形默认成本决定。
PathFinder.CostMatrix.prototype.considerStructures = function(room: Room): CostMatrix {
  let structures = (room.structures as (Structure | ConstructionSite)[]).concat(room.constructionSites);
  for (let s of structures) {
    switch (s.structureType) {
      case STRUCTURE_ROAD:
        this.set(s.pos.x, s.pos.y, 1);
        break;
      case STRUCTURE_CONTAINER:
        break;
      case STRUCTURE_RAMPART:
        if (!(s as StructureRampart).my && !(s as StructureRampart).isPublic) {
          this.set(s.pos.x, s.pos.y, 255);
        }
        break;
      default:
        this.set(s.pos.x, s.pos.y, 255);
        break;
    }
  }
  return this;
}

PathFinder.CostMatrix.prototype.avoidCreeps = function(room: Room): CostMatrix {
  let creeps = room.creeps;
  for (let c of creeps) {
    this.set(c.pos.x, c.pos.y, 255);
  }
  return this;
}

PathFinder.CostMatrix.prototype.avoidNonRoadCreeps = function(room: Room): CostMatrix {
  let creeps = room.creeps;
  for (let c of creeps) {
    if (!(c.my && !c.pos.parkable)) {
      this.set(c.pos.x, c.pos.y, 255);
    }
  }
  return this;
}

PathFinder.CostMatrix.prototype.avoidPositions = function(roomName: string, pos: RoomPosition[] | RoomPosition): CostMatrix {
  let pos_t = ensureArray(pos).filter(p => p.roomName === roomName);
  for (let p of pos_t) {
    this.set(p.x, p.y, 255);
  }
  return this;
}

PathFinder.CostMatrix.prototype.avoidRectangle = function(roomName: string, rect: Rectangle): CostMatrix {
  if (roomName === rect.roomName) {
    for (let p of rect.boundary) {
      this.set(p.x, p.y, 255);
    }
  }
  return this;
}
