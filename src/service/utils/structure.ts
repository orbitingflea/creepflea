Object.defineProperty(Structure, 'isHostile', {
  get: function() {
    return this instanceof OwnedStructure && !this.my;
  }
});
