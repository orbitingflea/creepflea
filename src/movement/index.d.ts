import { Rectangle } from 'lib/rectangle';
export {};

declare global {
  interface Destination {
    pos: RoomPosition;
    range: number;
    rangeMin: number;
    offRoad: boolean;
    keeperAttitude: string;
    dangerAttitude: string;
  }

  interface HeuristicDestination {
    pos: RoomPosition;
    range: number;
    flee: boolean;
  }

  interface FindPathMyOpts {
    keeperAttitude: string;  // default: avoid
    dangerAttitude: string;  // default: avoid
    ignoreRoads: boolean;  // default: false
    singleRoom: boolean;  // default: true, 仅当起点、终点在同一房间时有用
    /**
     * blocking：拥堵程度
     * 0: 没有拥堵
     * 1: 非道路拥堵
     * 2: 道路拥堵
     */
    blocking?: number;
    avoid: RoomPosition[] | RoomPosition | null;
  }

  interface FindPathMyResult {
    path: RoomPosition[];
    cost: number;
    incomplete: boolean;
    firstInvisibleRoom: string | null;
  }

  // 合并了 Destination 和 FindPathMyOpts，只需要传入一个对象
  interface DriveToOpts {
    range?: number;
    rangeMin?: number;
    offRoad?: boolean;
    keeperAttitude?: string;
    dangerAttitude?: string;
    ignoreRoads?: boolean;
    singleRoom?: boolean;
    avoid?: RoomPosition[] | RoomPosition | null;
  }

  interface CostMatrix {
    considerStructures(room: Room): CostMatrix;
    avoidCreeps(room: Room): CostMatrix;
    avoidNonRoadCreeps(room: Room): CostMatrix;
    avoidPositions(roomName: string, pos: RoomPosition[] | RoomPosition): CostMatrix;
    avoidRectangle(roomName: string, rect: Rectangle): CostMatrix;
  }

  interface RoomPosition {
    matchDestination(dest: Destination): boolean;
  }

  interface CreepCache {
    driveInfo?: DriveInfo;
  }

  interface DriveInfo {
    path: RoomPosition[];
    firstInvisibleRoom: string | null;
    lastPathLength: number;
    patience: number;
    destCode: string;
    optsCode: string;
  }

  interface Creep {
    _drive(dest: Destination, opts: FindPathMyOpts): number;
    driveTo(destination: RoomPosition | RoomObject, opts?: DriveToOpts): number;
    driveBlind(object: RoomObject | undefined, roomName: string, opts?: DriveToOpts): number;
    driveAhead(): number;
  }
}
