/**
 * 将常用的建筑列表缓存下来，避免每次都去 room.find。
 * 可以将 id list 存在缓存中，避免 Memory 解析开销。
 */

const SCAN_INFO_TTL = 200;

Room.prototype._scan = function(): void {
  let structures = this.find(FIND_STRUCTURES);
  let structureIdList = structures.map(s => s.id);
  let functionalStructureIdList = [];

  for (let structure of structures) {
    if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_RAMPART &&
        structure.structureType !== STRUCTURE_WALL) {
      functionalStructureIdList.push(structure.id);
    }
  }

  this.cache.scanInfo = {
    scanTime: Game.time,
    sourceIdList: this.find(FIND_SOURCES).map(s => s.id),
    mineralId: this.find(FIND_MINERALS)[0]?.id,
    structureIdList,
    functionalStructureIdList,
    constructionSiteIdList: this.find(FIND_CONSTRUCTION_SITES).map(s => s.id),
    structureIdListOfType: _.groupBy(structureIdList, id => Game.getObjectById(id)!.structureType)
  };
}

Room.prototype._ensureScanInfo = function(): void {
  if (!this.cache.scanInfo || this.cache.scanInfo.scanTime < Game.time - SCAN_INFO_TTL) {
    this._scan();
  }
}

Object.defineProperty(Room.prototype, 'sources', {
  configurable: true,
  get: function(): Source[] {
    this._ensureScanInfo();
    return (this as Room).cache.scanInfo!.sourceIdList.map((id: Id<Source>) => (Game.getObjectById(id) as Source));
  }
});

Object.defineProperty(Room.prototype, 'mineral', {
  configurable: true,
  get: function(): Mineral | null {
    this._ensureScanInfo();
    let id = (this as Room).cache.scanInfo!.mineralId;
    return id ? Game.getObjectById(id as Id<Mineral>) : null;
  }
});

Object.defineProperty(Room.prototype, 'structures', {
  configurable: true,
  get: function(): Structure[] {
    this._ensureScanInfo();
    let res = (this as Room).cache.scanInfo!.structureIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return (this as Room).cache.scanInfo!.structureIdList.map((id: Id<Structure>) => (Game.getObjectById(id) as Structure));
    } else {
      return res as Structure[];
    }
  }
});

Object.defineProperty(Room.prototype, 'functionalStructures', {
  configurable: true,
  get: function(): Structure[] {
    this._ensureScanInfo();
    let res = (this as Room).cache.scanInfo!.functionalStructureIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      (this as Room)._scan();
      return (this as Room).cache.scanInfo!.functionalStructureIdList.map((id: Id<Structure>) => Game.getObjectById(id) as Structure);
    } else {
      return res as Structure[];
    }
  }
});

Object.defineProperty(Room.prototype, 'constructionSites', {
  configurable: true,
  get: function(): ConstructionSite[] {
    this._ensureScanInfo();
    let res = (this as Room).cache.scanInfo!.constructionSiteIdList.map((id: Id<ConstructionSite>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      (this as Room)._scan();
      return (this as Room).cache.scanInfo!.constructionSiteIdList.map((id: Id<ConstructionSite>) => Game.getObjectById(id) as ConstructionSite);
    } else {
      return res as ConstructionSite[];
    }
  }
});

Room.prototype.structuresOfType = function(type: StructureConstant): Structure[] {
  this._ensureScanInfo();
  let foo = this.cache.scanInfo!.structureIdListOfType[type];
  if (!foo) {
    return [];
  }
  let res = foo.map((id: Id<Structure>) => Game.getObjectById(id));
  if (res.indexOf(null) >= 0) {
    this._scan();
    foo = this.cache.scanInfo!.structureIdListOfType[type];
    res = foo.map((id: Id<Structure>) => Game.getObjectById(id));
  }
  return res as Structure[];
}

Object.defineProperty(Room.prototype, 'roads', {
  configurable: true,
  get: function(): StructureRoad[] {
    return (this as Room).structuresOfType(STRUCTURE_ROAD) as StructureRoad[];
  }
});

Object.defineProperty(Room.prototype, 'ramparts', {
  configurable: true,
  get: function(): StructureRampart[] {
    return (this as Room).structuresOfType(STRUCTURE_RAMPART) as StructureRampart[];
  }
});

Object.defineProperty(Room.prototype, 'containers', {
  configurable: true,
  get: function(): StructureContainer[] {
    return (this as Room).structuresOfType(STRUCTURE_CONTAINER) as StructureContainer[];
  }
});

Object.defineProperty(Room.prototype, 'links', {
  configurable: true,
  get: function(): StructureLink[] {
    return (this as Room).structuresOfType(STRUCTURE_LINK) as StructureLink[];
  }
});

Object.defineProperty(Room.prototype, 'labs', {
  configurable: true,
  get: function(): StructureLab[] {
    return (this as Room).structuresOfType(STRUCTURE_LAB) as StructureLab[];
  }
});

Object.defineProperty(Room.prototype, 'extensions', {
  configurable: true,
  get: function(): StructureExtension[] {
    return (this as Room).structuresOfType(STRUCTURE_EXTENSION) as StructureExtension[];
  }
});

Object.defineProperty(Room.prototype, 'spawns', {
  configurable: true,
  get: function(): StructureSpawn[] {
    return (this as Room).structuresOfType(STRUCTURE_SPAWN) as StructureSpawn[];
  }
});

/**
 * Use hook to scan at beginning of each tick.
 */
// global.tickBeginHook.push(function(): void {
//   for (let name in Game.rooms) {
//     let room = Game.rooms[name];
//     room._ensureScanInfo();
//   }
// });
