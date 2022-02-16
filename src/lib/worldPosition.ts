export class WorldPosition {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getRangeTo(pos: WorldPosition) {
    return Math.max(Math.abs(this.x - pos.x), Math.abs(this.y - pos.y));
  }

  /**
   * getDirectionTo
      TOP: 1,
      TOP_RIGHT: 2,
      RIGHT: 3,
      BOTTOM_RIGHT: 4,
      BOTTOM: 5,
      BOTTOM_LEFT: 6,
      LEFT: 7,
      TOP_LEFT: 8,
   */

  getDirectionTo(pos: WorldPosition) {
    let dx = pos.x - this.x;
    let dy = -(pos.y - this.y);
    if (dx === 0 && dy === 0) return 0;
    if (dx === 0 && dy > 0) return 1;
    if (dx > 0 && dy > 0) return 2;
    if (dx > 0 && dy === 0) return 3;
    if (dx > 0 && dy < 0) return 4;
    if (dx === 0 && dy < 0) return 5;
    if (dx < 0 && dy < 0) return 6;
    if (dx < 0 && dy === 0) return 7;
    if (dx < 0 && dy > 0) return 8;
    return 0;
  }
}

export function toWorldPosition(pos: RoomPosition): WorldPosition {
  let roomName = pos.roomName;
  let idxMid = roomName.indexOf('S');
  if (idxMid === -1) {
    idxMid = roomName.indexOf('N');
  }
  let signX = roomName[0] === 'E' ? 1 : -1;
  let signY = roomName[idxMid] === 'S' ? 1 : -1;
  let roomX = parseInt(roomName.substr(1, idxMid - 1));
  let roomY = parseInt(roomName.substr(idxMid + 1));
  if (signX === -1) roomX = -roomX - 1;
  if (signY === -1) roomY = -roomY - 1;
  return new WorldPosition(roomX * 49 + pos.x, roomY * 49 + pos.y);
}
