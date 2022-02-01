interface Memory {

}

interface StructureLink {
  gotEnergy: boolean;
}

interface CreepMemory {
  configName: string;
}

interface Creep {
  work(): void;
}

declare var CreepManager: any;
