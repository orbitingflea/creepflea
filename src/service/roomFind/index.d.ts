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

  containers: StructureContainer[];
  links: StructureLink[];
  labs: StructureLab[];
  extensions: StructureExtension[];
  spawns: StructureSpawn[];

  _scanCreeps(): void;
  _creeps?: {
    all: Creep[];
    my: Creep[];
    invader: Creep[];
    keeper: Creep[];
    neutral: Creep[];
    hostilePlayer: Creep[];
    hostile: Creep[];
  }

  creeps: Creep[];
  myCreeps: Creep[];
  hostileCreeps: Creep[];
  hostilePlayerCreeps: Creep[];
  hostilePlayerDangerousCreeps: Creep[];
  neutralCreeps: Creep[];
  invaders: Creep[];
  keepers: Creep[];
}

interface RoomCache {
  scanInfo?: {
    scanTime: number;
    sourceIdList: Id<Source>[];
    mineralId: Id<Mineral> | null;
    structureIdList: Id<Structure>[];
    functionalStructureIdList: Id<Structure>[];
    constructionSiteIdList: Id<ConstructionSite>[];
    roadIdList: Id<StructureRoad>[];
    rampartIdList: Id<StructureRampart>[];
    containerIdList: Id<StructureContainer>[];
    linkIdList: Id<StructureLink>[];
    labIdList: Id<StructureLab>[];
    extensionIdList: Id<StructureExtension>[];
    spawnIdList: Id<StructureSpawn>[];
  }
}
