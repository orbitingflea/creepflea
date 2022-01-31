/**
 * 本文件定义了 Rectangular class，有四个基础属性 xl, xr, yl, yr，支持一些简单的功能
 * 在 SK 场景中用来划定危险区域
 * 适用于长宽比较接近的矩形
 */

export class Rectangle {
    constructor (xl, xr, yl, yr, roomName) {
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

    contains(pos) {
        return pos.x >= this.xl && pos.x <= this.xr && pos.y >= this.yl && pos.y <= this.yr && pos.roomName === this.roomName;
    }

    extendWidth() {
        if (this.xr < 49) {
            this.xr++;
        } else if (this.xl > 0) {
            this.xl--;
        } else {
            console.log(`[ERROR] extendWidth failed, not implemented`);
        }
    }

    extendHeight() {
        if (this.yr < 49) {
            this.yr++;
        } else if (this.yl > 0) {
            this.yl--;
        } else {
            console.log(`[ERROR] extendWidth failed, not implemented`);
        }
    }

    extendShorter() {
        if (this.width <= this.height && this.width % 2 == 0) {
            this.extendWidth();
        }
        if (this.height <= this.width && this.height % 2 == 0) {
            this.extendHeight();
        }
    }

    getBoundary() {
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

    getSquareCover() {
        this.extendShorter();
        if (this.width <= this.height) {
            // 纵中轴线
            let axis = (this.xl + this.xr) / 2;
            let range = (this.xr - this.xl) / 2;
            let ymin = this.yl + range;
            let ymax = this.yr - range;
            let res = [];
            for (let y = ymin; ; y += 2 * range + 1) {
                if (y > ymax) y = ymax;
                res.push({
                    pos: new RoomPosition(axis, y, this.roomName),
                    range: range
                });
                if (y == ymax) break;
            }
            return res;
        } else {
            // 横中轴线
            let axis = (this.yl + this.yr) / 2;
            let range = (this.yr - this.yl) / 2;
            let xmin = this.xl + range;
            let xmax = this.xr - range;
            let res = [];
            for (let x = xmin; ; x += 2 * range + 1) {
                if (x > xmax) x = xmax;
                res.push({
                    pos: new RoomPosition(x, axis, this.roomName),
                    range: range
                });
                if (x == xmax) break;
            }
            return res;
        }
    }
}

/**
 * load from json v
 */
export function LoadRectangle(v) {
    return new Rectangle(v.xl, v.xr, v.yl, v.yr, v.roomName);
}