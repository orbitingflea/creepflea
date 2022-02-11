interface RoomPosition {
  terrain: number;
  walkable: boolean;
  parkable: boolean;
  visible: boolean;
  isWall: boolean;
  isEdge: boolean;
  isRoad: boolean;
  underCreep: boolean;
  code: string;
}

interface Creep {
  isHostile: boolean;
  inWhiteList: boolean;
  hasAttackParts: boolean;
  hasHealParts: boolean;
  isDangerous: boolean;

  repairRoad: () => number;
  collectEnergyOrDrop: () => number;
}

interface Room {
  my: boolean;
  isKeeperRoom: boolean;  // 需要晚于 roomFind 加载
}

interface StructureLink {
  gotEnergy?: boolean;
  tryTransfer: (target: StructureLink) => number;
}
