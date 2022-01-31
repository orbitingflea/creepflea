/**
 * 当传入参数 offRoad 的时候，对目标进行处理，变成 RoomPosition 的集合
 */
export function OffRoadTransformation(destination, rangeL, rangeR) {
    let res = [];
    const xl_out = Math.max(destination.x - rangeR, 1);
    const xr_out = Math.min(destination.x + rangeR, 49);
    const yl_out = Math.max(destination.y - rangeR, 1);
    const yr_out = Math.min(destination.y + rangeR, 49);
    const xl_in = destination.x - rangeL;
    const xr_in = destination.x + rangeL;
    const yl_in = destination.y - rangeL;
    const yr_in = destination.y + rangeL;
    for (let x = xl_out; x <= xr_out; x++) {
        for (let y = yl_out; y <= yr_out; y++) {
            if (x <= xl_in || x >= xr_in || y <= yl_in || y >= yr_in) {
                const pos = new RoomPosition(x, y, destination.roomName);
                if (pos.parkable) res.push(pos);
            }
        }
    }
    return res;
}

// 已弃用，请用 rectangle.js
export function BoundaryOfRectangle(xl, xr, yl, yr, roomName) {
    let res = [];
    for (let x = xl; x <= xr; ++x) {
        res.push(new RoomPosition(x, yl, roomName));
        res.push(new RoomPosition(x, yr, roomName));
    }
    for (let y = yl + 1; y < yr; ++y) {
        res.push(new RoomPosition(xl, y, roomName));
        res.push(new RoomPosition(xr, y, roomName));
    }
    return res;
}