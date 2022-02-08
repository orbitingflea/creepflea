interface Memory {

}

interface StructureLink {
  gotEnergy: boolean;
}

interface CreepMemory {
  configName: string;
  target: any;  // to be deleted
  driveInfo?: any; // debug
}

interface Creep {
  work(): void;
  park(): void;
}

interface RoomMemory {
  _spawnedDefender?: boolean;
}

declare var CreepManager: any;
declare var decodeRoomPosition: (code: string) => RoomPosition;
declare const roomDanger: (roomName: string) => DangerInfo | null;
