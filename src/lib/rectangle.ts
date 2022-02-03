/**
 * class Rectangle 表示地理位置上的矩形，包含了 roomName 的信息
 * 其逻辑上是 RoomPosition 的集合
 */

// export interface Rectangle {
//   xl: number;
//   xr: number;
//   yl: number;
//   yr: number;
//   roomName: string;
//   width: number;
//   height: number;
//   contains(pos: RoomPosition): boolean;
//   boundary: RoomPosition[];
//   encode: string;
//   getPosRangeCover(): {pos: RoomPosition, range: number}[];
// }

export class Rectangle {
  xl: number;
  xr: number;
  yl: number;
  yr: number;
  roomName: string;

  constructor (xl: number, xr: number, yl: number, yr: number, roomName: string) {
    this.xl = xl;
    this.xr = xr;
    this.yl = yl;
    this.yr = yr;
    this.roomName = roomName;
  }

  get width() {
    return this.xr - this.xl + 1;
  }

  get height() {
    return this.yr - this.yl + 1;
  }

  contains(pos: RoomPosition) {
    return pos.x >= this.xl && pos.x <= this.xr && pos.y >= this.yl && pos.y <= this.yr && pos.roomName === this.roomName;
  }

  get boundary() {
    let res = [];
    for (let x = this.xl; x <= this.xr; ++x) {
        res.push(new RoomPosition(x, this.yl, this.roomName));
        res.push(new RoomPosition(x, this.yr, this.roomName));
    }
    for (let y = this.yl + 1; y < this.yr; ++y) {
        res.push(new RoomPosition(this.xl, y, this.roomName));
        res.push(new RoomPosition(this.xr, y, this.roomName));
    }
    return res;
  }

  get encode() {
    return `${this.xl},${this.xr},${this.yl},${this.yr},${this.roomName}`;
  }

  getPosRangeCover(): {pos: RoomPosition, range: number}[] {
    if (this.width <= this.height) {
      let axis = roundToCenter((this.xl + this.xr) / 2);
      let range = Math.ceil((this.xr - this.xl) / 2);
      let ymin = this.yl + range;
      let ymax = this.yr - range;
      let res = [];
      for (let y = ymin; ; y += 2 * range + 1) {
        if (y > ymax) y = ymax;
        res.push({
          pos: new RoomPosition(axis, y, this.roomName),
          range,
        });
        if (y === ymax) break;
      }
      return res;
    } else {
      let axis = roundToCenter((this.yl + this.yr) / 2);
      let range = Math.ceil((this.yr - this.yl) / 2);
      let xmin = this.xl + range;
      let xmax = this.xr - range;
      let res = [];
      for (let x = xmin; ; x += 2 * range + 1) {
        if (x > xmax) x = xmax;
        res.push({
          pos: new RoomPosition(x, axis, this.roomName),
          range,
        });
        if (x === xmax) break;
      }
      return res;
    }
  }
}

function roundToCenter(x: number) {
  if (x >= 25) return Math.floor(x);
  else return Math.ceil(x);
}

export function decodeRectangle(str: string): Rectangle {
  let [xl, xr, yl, yr, roomName] = str.split(',');
  return new Rectangle(Number(xl), Number(xr), Number(yl), Number(yr), roomName);
}
