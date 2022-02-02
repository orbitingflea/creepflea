interface Memory {

}

interface StructureLink {
  gotEnergy: boolean;
}

interface CreepMemory {
  configName: string;
  driveInfo: any;  // to be deleted
  target: any;  // to be deleted
}

interface Creep {
  work(): void;
  driveStep(): boolean;
  driveTo(destination: RoomPosition | RoomObject, opts?: any): boolean;
  park(): void;
}

declare var CreepManager: any;
