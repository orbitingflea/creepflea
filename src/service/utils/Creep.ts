const WHITE_LIST = ['Mina'];

Object.defineProperty(Creep.prototype, 'isHostile', {
  configurable: true,
  get: function(): boolean {
    return !this.my && (this.owner.username === 'Invader' ||
      !this.inWhiteList && this.owner.username !== 'Source Keeper');
  }
});

Object.defineProperty(Creep.prototype, 'inWhiteList', {
  configurable: true,
  get: function(): boolean {
    return WHITE_LIST.includes(this.owner.username);
  }
});

Object.defineProperty(Creep.prototype, 'hasAttackParts', {
  configurable: true,
  get: function(): boolean {
    return this.body.some((part: any) => part.type === ATTACK || part.type === RANGED_ATTACK);
  }
});

Object.defineProperty(Creep.prototype, 'hasHealParts', {
  configurable: true,
  get: function(): boolean {
    return this.body.some((part: any) => part.type === HEAL);
  }
});

Object.defineProperty(Creep.prototype, 'isDangerous', {
  configurable: true,
  get: function(): boolean {
    return this.hasAttackParts || this.hasHealParts;
  }
});
