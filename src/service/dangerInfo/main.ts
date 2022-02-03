/**
 * 支持查询一个房间的 (active) lair regions，以及查询房间是否危险（即有入侵者）
 * 查询 active lair region 需要视野，其他两种不需要视野。存储辅助信息以帮助判断房间危险情况。
 *
 * 必须晚于 roomFind 加载
 */

function getCollapseTime(s: StructureInvaderCore) {
  return s.effects.find(e => e.effect === EFFECT_COLLAPSE_TIMER)?.ticksRemaining;
}

// 扫描危险，记在内存里面
Room.prototype._scanDanger = function() {
  if (this.my) {
    this.memory.danger = null;
    return;
  }
  let ticksToEnd = 0;
  let type = null;
  for (let creep of this.invaders) {
    if (creep.ticksToLive) {
      ticksToEnd = Math.max(ticksToEnd, creep.ticksToLive);
      type = 'invader';
    }
  }
  for (let creep of this.invaders) {
    if (creep.ticksToLive) {
      ticksToEnd = Math.max(ticksToEnd, creep.ticksToLive);
      type = 'hostile';
    }
  }
  for (let s of this.functionalStructures.filter(s => s.structureType === STRUCTURE_INVADER_CORE)) {
    if ((s as StructureInvaderCore).level > 0) {
      let collapseTime = getCollapseTime(s as StructureInvaderCore);
      if (collapseTime === undefined) {
        collapseTime = (s as StructureInvaderCore).ticksToDeploy + STRONGHOLD_DECAY_TICKS * 1.1;
      }
      ticksToEnd = Math.max(ticksToEnd, collapseTime);
      type = 'stronghold';
    }
  }
  if (type === null) {
    this.memory.danger = null;
  } else {
    this.memory.danger = {
      type,
      endTime: Game.time + ticksToEnd,
    };
  }
}

Object.defineProperty(Room.prototype, 'danger', {
  get: function(): DangerInfo | null {
    if (this._danger === undefined) {
      this._scanDanger();
      this._danger = this.memory.danger;
    }
    return this._danger;
  }
});

global.roomDanger = function(roomName: string): DangerInfo | null {
  const room = Game.rooms[roomName];
  if (room) {
    return room.danger;
  } else if (Memory.rooms[roomName]) {
    return Game.rooms[roomName].danger;
  } else {
    return null;
  }
}
