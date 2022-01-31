/**
 * 本文件的核心是两个函数：driveStep 和 driveTo。
 * 
 * driveTo 的接口与 moveTo 类似，使 creep 移动到唯一的目标，within range。
 * opts 里支持以下参数：
 * - range: 距离目标的最大距离，默认为 1
 * - rangeMin: 距离目标的最小距离，默认为 0
 * - offRoad: 仅保留那些不在路上的点作为目标
 * - dangerZone: 一个矩形，表示危险区域。如果 creep 在这个区域内，则会先寻路走出这个区域；然后，在寻路的过程中就不再进入这个区域了。
 */

import { staticCallback, creepCallback, banDangerZone } from './callback.js';
import { LoadRectangle, Rectangle } from './rectangle.js';

const MAX_PATIENT = 3;

function DecodeRoomPosition(pos) {
    return new RoomPosition(pos.x, pos.y, pos.roomName);
}

function CleanPath(path, creep) {
    if (path.length > 0 && DecodeRoomPosition(path[0]).isEqualTo(creep.pos)) {
        path.splice(0, 1);
    } else if (path.length > 1 && DecodeRoomPosition(path[1]).isEqualTo(creep.pos)) {
        path.splice(0, 2);
    }
    return path;
}




/**
 * 读取 driveTo 格式的 opts，并判断是否已经达到目标
 * 因为可能会沿着 incomplete path 前进，在 path 结束的时候需要做这个判断
 */
 function MatchDestination(origin, destination, opts) {
    let dist = origin.getRangeTo(destination);
    let rangeMin = opts.rangeMin == null ? 0 : opts.rangeMin;
    if (dist < rangeMin || dist > opts.range) return false;
    if (opts.offRoad && !origin.parkable) return false;
    
    // danger zone
    if (opts.dangerZone != null) {
        let dangerZone = LoadRectangle(opts.dangerZone);
        if (dangerZone.contains(origin)) return false;
    }
    
    return true;
}

RoomPosition.prototype.matchDestination = function(destination, opts) {
    return MatchDestination(this, destination, opts);
}



/**
 * FindPath：根据 driveTo 支持的 opts 调用 PathFinder 找到路径
 * blocking: 0 表示没有拥堵，1 表示非道路拥堵，2 表示道路拥堵
 */
function _FindPath(origin, destination, opts, blocking = 0) {
    let callback;
    callback = staticCallback(1);
    if (blocking == 1) {
        callback = creepCallback(false);
    } else if (blocking == 2) {
        callback = creepCallback(true);
    }

    let trans_opt = {
        plainCost: 2,
        swampCost: 10,
        roomCallback: callback,
    };

    if (opts.dangerZone != null) {
        let dangerZone = LoadRectangle(opts.dangerZone);
        if (dangerZone.contains(origin)) {
            // 阶段性目标：走出危险区
            let pfTargets = dangerZone.getSquareCover();
            trans_opt.flee = true;
            return PathFinder.search(origin, pfTargets.map(
                data => ({
                    pos: data.pos,
                    range: data.range + 1
                })
            ), trans_opt);
        } else {
            // 修改 callback，禁止危险区域
            let newCallback = banDangerZone(dangerZone, callback, origin.roomName);
            trans_opt.roomCallback = newCallback;
            // 继续执行
        }
    }

    let distance = origin.getRangeTo(destination);
    if (distance > opts.range) {
        return PathFinder.search(origin, {pos: destination, range: opts.range}, trans_opt);
    } else if (opts.rangeMin && distance < opts.rangeMin) {
        trans_opt.flee = true;
        return PathFinder.search(origin, {pos: destination, range: opts.rangeMin}, trans_opt);
    }

    if (opts.offRoad) {
        // 进入这一分支时，creep 已经在目标区域内，现在寻找停车地点。
        // 从 creep 开始向外搜索，必须同时满足 !underCreep、MatchDestination 的条件。
        for (let d = 1; d <= 5; d++) {
            let rect = new Rectangle(
                Math.max(origin.x - d, 1),
                Math.min(origin.x + d, 48),
                Math.max(origin.y - d, 1),
                Math.min(origin.y + d, 48),
                origin.roomName
            );
            let points = rect.getBoundary().filter(
                p => MatchDestination(p, destination, opts) && !p.underCreep
            );
            if (points.length > 0) {
                return PathFinder.search(
                    origin,
                    points.map(p => ({pos: p, range: 0})),
                    trans_opt
                );
            }
        }
        console.log(`[WARN] 停车搜索无结果: ${origin} -> ${destination}, opts: ${JSON.stringify(opts)}`);
        return null;
    }

    console.log(`[WARN] FindPath 什么都没做: ${origin} -> ${destination}, opts: ${JSON.stringify(opts)}`);
    return null;
}


function FindPath(origin, destination, opts, blocking = 0) {
    let clock = Game.cpu.getUsed();
    let path = _FindPath(origin, destination, opts, blocking);
    let clock2 = Game.cpu.getUsed();
    if (clock2 - clock > 0.5) {
        console.log(`[INFO] FindPath ${origin} -> ${destination} used ${clock2 - clock} CPU. opts: ${JSON.stringify(opts)}`);
    }
    return path;
}



function MoveAlongPath(creep, driveInfo) {
    let nextPos = DecodeRoomPosition(driveInfo.path[0]);
    // correctness check, not necessary
    if ((creep.pos.isEqualTo(nextPos) || !creep.pos.inRangeTo(nextPos, 1)) &&
        !(creep.pos.roomName !== nextPos.roomName && creep.pos.isEdge)) {
        console.log(`[WARN] Path Error: now at ${creep.pos}, nextPos ${nextPos}`);
    }
    let nextDir = creep.pos.getDirectionTo(nextPos);
    creep.move(nextDir);
}


/**
 * 沿着当前道路继续行驶
 * 返回值表示是否 move，这将指导调用者判断本 tick 是否还能执行动作
 */
Creep.prototype.driveStep = function() {
    if (!this.my || this.spawning || this.fatigue > 0) {
        return false;
    }

    let driveInfo = this.memory.driveInfo;
    if (driveInfo == null) return false;
    if (MatchDestination(this.pos, DecodeRoomPosition(driveInfo.destination), driveInfo.opts)) {
        this.memory.driveInfo = null;
        return false;
    }
    driveInfo.path = CleanPath(driveInfo.path, this);
    let recompute = (driveInfo.path.length == 0);

    // compute patient
    let blocking = 0;
    if (this.pos.isEqualTo(DecodeRoomPosition(driveInfo.lastPos))) {
        if (--driveInfo.patient <= 0) {
            let blockingPos = DecodeRoomPosition(driveInfo.path[0]);
            blocking = blockingPos.isRoad ? 2 : 1;
            recompute = true;
        }
    } else {
        driveInfo.lastPos = this.pos;
        driveInfo.patient = MAX_PATIENT;
    }

    if (recompute) {
        // recompute path to destination
        let destination = DecodeRoomPosition(driveInfo.destination);
        let opts = driveInfo.opts;
        let result = FindPath(this.pos, destination, opts, blocking);
        let path = CleanPath(result.path, this);
        if (path.length == 0) {
            // cannot be closer to destination, clear this task
            this.memory.driveInfo = null;
            return false;
        }
        this.memory.driveInfo = {
            destination: destination,
            opts: opts,
            path: path,
            lastPos: this.pos,
            patient: MAX_PATIENT
        };
        driveInfo = this.memory.driveInfo;
    }

    MoveAlongPath(this, driveInfo);
    return true;
}



/**
 * 寻路或读取缓存路线，行驶到目标位置
 * 返回值表示是否 move，这将指导调用者判断本 tick 是否还能执行动作
 */
Creep.prototype.driveTo = function(destination, opts = {}) {
    // check whether this creep can move
    if (!this.my || this.spawning || this.fatigue > 0) {
        return false;
    }

    if (destination instanceof RoomObject) {
        destination = destination.pos;
    }
    if (!(destination instanceof RoomPosition)) {
        console.log(`[ERROR] driveTo destination not supported. Switched to moveTo.`);
        this.moveTo(destination, opts);
        return true;
    }
    if (opts.range == null) opts.range = 1;
    if (opts.rangeMin == null) opts.rangeMin = 0;
    if (MatchDestination(this.pos, destination, opts)) return false;

    // see whether cached path
    let reuse = false;
    if (this.memory.driveInfo) {
        let driveInfo = this.memory.driveInfo;
        if (destination.isEqualTo(DecodeRoomPosition(driveInfo.destination)) && _.isEqual(driveInfo.opts, opts)) {
            // called with same parameters
            reuse = true;
            driveInfo.path = CleanPath(driveInfo.path, this);
            if (driveInfo.path.length == 0) {
                reuse = false;
            }
        }
    }

    // calculate patient
    let blocking = 0;
    if (reuse) {
        let driveInfo = this.memory.driveInfo;
        if (this.pos.isEqualTo(DecodeRoomPosition(driveInfo.lastPos))) {
            if (--driveInfo.patient <= 0) {
                let blockingPos = DecodeRoomPosition(driveInfo.path[0]);
                blocking = blockingPos.isRoad ? 2 : 1;
                reuse = false;
            }
        } else {
            driveInfo.lastPos = this.pos;
            driveInfo.patient = MAX_PATIENT;
        }
    }

    if (!reuse) {
        let result = FindPath(this.pos, destination, opts, blocking);
        if (!result) {
            this.memory.driveInfo = null;
            return false;
        }
        let path = CleanPath(result.path, this);
        if (path.length == 0) {
            this.memory.driveInfo = null;
            return false;
        }
        this.memory.driveInfo = {
            destination: destination,
            opts: opts,
            path: path,
            lastPos: this.pos,
            patient: MAX_PATIENT
        };
    }

    // drive one step
    let driveInfo = this.memory.driveInfo;
    MoveAlongPath(this, driveInfo);
    return true;
}