/**
 * Find creeps in the room. Information only keeps 1 tick.
 */

Room.prototype._scanCreeps = function(): void {
  let creeps = this.find(FIND_CREEPS);
  let my = [];
  let hostile = [];
  let hostilePlayer = [];
  let invader = [];
  let keeper = [];
  let neutral = [];
  for (let creep of creeps) {
    if (creep.my) {
      my.push(creep);
    } else if (creep.owner && creep.owner.username === 'Invader') {
      invader.push(creep);
      hostile.push(creep);
    } else if (creep.owner && creep.owner.username === 'Source Keeper') {
      keeper.push(creep);
    } else if (creep.isHostile) {
      hostile.push(creep);
      hostilePlayer.push(creep);
    } else {
      neutral.push(creep);
    }
  }
  this._creeps = {
    all: creeps,
    my,
    hostile,
    invader,
    keeper,
    neutral,
    hostilePlayer,
  };
};

Object.defineProperty(Room.prototype, 'creeps', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.all;
  }
});

Object.defineProperty(Room.prototype, 'myCreeps', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.my;
  }
});

Object.defineProperty(Room.prototype, 'hostileCreeps', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.hostile;
  }
});

Object.defineProperty(Room.prototype, 'invaders', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.invader;
  }
});

Object.defineProperty(Room.prototype, 'keepers', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.keeper;
  }
});

Object.defineProperty(Room.prototype, 'neutralCreeps', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.neutral;
  }
});

Object.defineProperty(Room.prototype, 'hostilePlayerCreeps', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.hostilePlayer;
  }
});

Object.defineProperty(Room.prototype, 'hostilePlayerDangerousCreeps', {
  configurable: true,
  get: function(): Creep[] {
    if (!this._creeps) this._scanCreeps();
    return this._creeps.hostilePlayer.filter((c: Creep) => c.isDangerous);
  }
});
