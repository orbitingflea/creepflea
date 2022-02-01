interface Room {
  _scan(): void;
  _ensureScanInfo(): void;

  sources: Source[];
  mineral: Mineral | null;
  structures: Structure[];
  constructionSites: ConstructionSite[];
  functionalStructures: Structure[];
  roads: StructureRoad[];
  ramparts: StructureRampart[];

  _scanCreeps(): void;
  _creeps: {
    all: Creep[];
    my: Creep[];
    hostile: Creep[];
    invader: Creep[];
    keeper: Creep[];
    neutral: Creep[];
  }

  creeps: Creep[];
  myCreeps: Creep[];
  hostileCreeps: Creep[];
  neutralCreeps: Creep[];
  invaders: Creep[];
  keepers: Creep[];
}

interface RoomCache {
  scanInfo: {
    scanTime: number;
    sourceIdList: Id<Source>[];
    mineralId: Id<Mineral> | null;
    structureIdList: Id<Structure>[];
    functionalStructureIdList: Id<Structure>[];
    constructionSiteIdList: Id<ConstructionSite>[];
    roadIdList: Id<StructureRoad>[];
    rampartIdList: Id<StructureRampart>[];
  }
}