/**
 * 将常用的建筑列表缓存下来，避免每次都去 room.find。
 * 可以将 id list 存在缓存中，避免 Memory 解析开销。
 */

const SCAN_INFO_TTL = 200;

Room.prototype._scan = function(): void {
  let structures = this.find(FIND_STRUCTURES);
  let structureIdList = structures.map(s => s.id);
  let roadIdList = [];
  let rampartIdList = [];
  let functionalStructureIdList = [];
  let containerIdList = [];
  let linkIdList = [];
  let labIdList = [];
  let extensionIdList = [];
  let spawnIdList = [];
  for (let structure of structures) {
    if (structure.structureType === STRUCTURE_ROAD) {
      roadIdList.push(structure.id);
    } else if (structure.structureType === STRUCTURE_RAMPART) {
      rampartIdList.push(structure.id);
    } else {
      functionalStructureIdList.push(structure.id);
      if (structure.structureType === STRUCTURE_CONTAINER) {
        containerIdList.push(structure.id);
      } else if (('my' in structure) && structure.my) {
        if (structure.structureType === STRUCTURE_LINK) {
          linkIdList.push(structure.id);
        } else if (structure.structureType === STRUCTURE_LAB) {
          labIdList.push(structure.id);
        } else if (structure.structureType === STRUCTURE_EXTENSION) {
          extensionIdList.push(structure.id);
        } else if (structure.structureType === STRUCTURE_SPAWN) {
          spawnIdList.push(structure.id);
        }
      }
    }
  }
  this.cache.scanInfo = {
    scanTime: Game.time,
    sourceIdList: this.find(FIND_SOURCES).map(s => s.id),
    mineralId: this.find(FIND_MINERALS)[0]?.id,
    structureIdList,
    functionalStructureIdList,
    constructionSiteIdList: this.find(FIND_CONSTRUCTION_SITES).map(s => s.id),
    roadIdList,
    rampartIdList,
    containerIdList,
    linkIdList,
    labIdList,
    extensionIdList,
    spawnIdList,
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
    return this.cache.scanInfo.sourceIdList.map((id: Id<Source>) => Game.getObjectById(id));
  }
});

Object.defineProperty(Room.prototype, 'mineral', {
  configurable: true,
  get: function(): Mineral | null {
    let id = this.cache.scanInfo.mineralId;
    return id === null ? null : Game.getObjectById(id as Id<Mineral>);
  }
});

Object.defineProperty(Room.prototype, 'structures', {
  configurable: true,
  get: function(): Structure[] {
    let res = this.cache.scanInfo.structureIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.structureIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'functionalStructures', {
  configurable: true,
  get: function(): Structure[] {
    let res = this.cache.scanInfo.functionalStructureIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.functionalStructureIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'constructionSites', {
  configurable: true,
  get: function(): ConstructionSite[] {
    let res = this.cache.scanInfo.constructionSiteIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.constructionSiteIdList.map((id: Id<Structure>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'roads', {
  configurable: true,
  get: function(): StructureRoad[] {
    let res = this.cache.scanInfo.roadIdList.map((id: Id<StructureRoad>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.roadIdList.map((id: Id<StructureRoad>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'ramparts', {
  configurable: true,
  get: function(): StructureRampart[] {
    let res = this.cache.scanInfo.rampartIdList.map((id: Id<StructureRampart>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.rampartIdList.map((id: Id<StructureRampart>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'containers', {
  configurable: true,
  get: function(): StructureContainer[] {
    let res = this.cache.scanInfo.containerIdList.map((id: Id<StructureContainer>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.containerIdList.map((id: Id<StructureContainer>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'links', {
  configurable: true,
  get: function(): StructureLink[] {
    let res = this.cache.scanInfo.linkIdList.map((id: Id<StructureLink>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.linkIdList.map((id: Id<StructureLink>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'labs', {
  configurable: true,
  get: function(): StructureLab[] {
    let res = this.cache.scanInfo.labIdList.map((id: Id<StructureLab>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.labIdList.map((id: Id<StructureLab>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

// START EDITING BELOW

Object.defineProperty(Room.prototype, 'extensions', {
  configurable: true,
  get: function(): StructureExtension[] {
    let res = this.cache.scanInfo.extensionIdList.map((id: Id<StructureExtension>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.extensionIdList.map((id: Id<StructureExtension>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

Object.defineProperty(Room.prototype, 'spawns', {
  configurable: true,
  get: function(): StructureSpawn[] {
    let res = this.cache.scanInfo.spawnIdList.map((id: Id<StructureSpawn>) => Game.getObjectById(id));
    if (res.indexOf(null) >= 0) {
      this._scan();
      return this.cache.scanInfo.spawnIdList.map((id: Id<StructureSpawn>) => Game.getObjectById(id));
    } else {
      return res;
    }
  }
});

/**
 * Use hook to scan at beginning of each tick.
 */
global.tickBeginHook.push(function(): void {
  for (let name in Game.rooms) {
    let room = Game.rooms[name];
    room._ensureScanInfo();
    // room._scanCreeps();  // save some for-loop time.
  }
});
