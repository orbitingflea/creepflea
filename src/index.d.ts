interface Memory {
  creepTmpRequire?: { [name: string]: number };
}

interface CreepMemory {
  target?: any;  // to be deleted
  driveInfo?: any; // debug
}

interface Creep {
  work(): void;
  park(): void;
}

interface RoomMemory {
  _spawnedDefender?: boolean;
}

interface RoomObjectCache {
  isContainerNearController?: boolean;
}

// declare var creepManager: any;
declare var decodeRoomPosition: (code: string) => RoomPosition;
declare const roomDanger: (roomName: string) => DangerInfo | null;
