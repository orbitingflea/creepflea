Object.defineProperty(RoomPosition.prototype, 'terrain', {
  configurable: true,
  get: function(): number {
    return Game.map.getRoomTerrain(this.roomName).get(this.x, this.y);
  }
});

Object.defineProperty(RoomPosition.prototype, 'walkable', {
  configurable: true,
  get: function(): boolean {
    if (this.terrain == TERRAIN_MASK_WALL) return false;
    if (!this.visible) return true;

    if (this.lookFor(LOOK_STRUCTURES).filter(
      (structure: Structure) =>
        (structure.structureType !== STRUCTURE_ROAD &&
        structure.structureType !== STRUCTURE_CONTAINER &&
        (structure.structureType !== STRUCTURE_RAMPART ||
        !(structure as StructureRampart).my))
    ).length > 0) return false;

    if (this.lookFor(LOOK_CONSTRUCTION_SITES).filter(
      (site: ConstructionSite) =>
        (site.structureType !== STRUCTURE_ROAD &&
        site.structureType !== STRUCTURE_CONTAINER &&
        (site.structureType !== STRUCTURE_RAMPART ||
        !site.my))
    ).length > 0) return false;
    return true;
  }
});

Object.defineProperty(RoomPosition.prototype, 'parkable', {
  configurable: true,
  get: function(): boolean {
    if (this.terrain == TERRAIN_MASK_WALL) return false;
    if (!this.visible) return true;
    if (this.isEdge) return false;

    let flags = this.lookFor(LOOK_FLAGS);
    if (flags.find((flag: Flag) => flag.color === COLOR_YELLOW)) return true;
    if (this.lookFor(LOOK_STRUCTURES).find(
      (structure: Structure) => (structure.structureType !== STRUCTURE_RAMPART || !(structure as StructureRampart).my)
    )) return false;
    if (this.lookFor(LOOK_CONSTRUCTION_SITES).find(
      (site: ConstructionSite) => (site.structureType !== STRUCTURE_RAMPART || !site.my)
    )) return false;
    if (flags.find((flag: Flag) => flag.color == COLOR_WHITE)) return false;

    return true;
  }
});

Object.defineProperty(RoomPosition.prototype, 'visible', {
  configurable: true,
  get: function(): boolean {
    return !!Game.rooms[this.roomName];
  }
});

Object.defineProperty(RoomPosition.prototype, 'isWall', {
  configurable: true,
  get: function(): boolean {
    return this.terrain == TERRAIN_MASK_WALL;
  }
});

Object.defineProperty(RoomPosition.prototype, 'isEdge', {
  configurable: true,
  get: function(): boolean {
      return this.x === 0 || this.x === 49 || this.y === 0 || this.y === 49;
  }
});

Object.defineProperty(RoomPosition.prototype, 'underCreep', {
  configurable: true,
  get: function(): boolean {
    return this.visible &&
      (this.lookFor(LOOK_CREEPS).length > 0 ||
      this.lookFor(LOOK_POWER_CREEPS).length > 0);
  }
});

Object.defineProperty(RoomPosition.prototype, 'isRoad', {
  configurable: true,
  get: function(): boolean {
    return this.visible && this.lookFor(LOOK_STRUCTURES)
      .concat(this.lookFor(LOOK_CONSTRUCTION_SITES))
      .find((structure: Structure | ConstructionSite) => structure.structureType === STRUCTURE_ROAD);
  }
});

Object.defineProperty(RoomPosition.prototype, 'code', {
  configurable: true,
  get: function(): string {
    return this.roomName + '_' + this.x + '_' + this.y;
  }
});

global.decodeRoomPosition = function(code: string): RoomPosition {
  let [roomName, x, y] = code.split('_');
  return new RoomPosition(+x, +y, roomName);
}
