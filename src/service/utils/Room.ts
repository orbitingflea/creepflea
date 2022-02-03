Object.defineProperty(Room.prototype, 'my', {
  get: function() {
    return this.controller && this.controller.my;
  }
});

Object.defineProperty(Room.prototype, 'isKeeperRoom', {
  get: function() {
    return this.functionalStructures.some((s: Structure) => s.structureType === STRUCTURE_KEEPER_LAIR);
  }
});
