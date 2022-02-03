interface RoomPosition {
  terrain: number;
  walkable: boolean;
  parkable: boolean;
  visible: boolean;
  isWall: boolean;
  isEdge: boolean;
  isRoad: boolean;
  underCreep: boolean;
}

interface Creep {
  isHostile: boolean;
  inWhiteList: boolean;
  hasAttackParts: boolean;
}

interface Room {
  my: boolean;
  isKeeperRoom: boolean;  // 需要晚于 roomFind 加载
}
