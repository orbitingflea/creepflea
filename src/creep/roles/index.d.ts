type CreepRoleOld = (args: any) => {
  prepare?: ((creep: Creep) => boolean) | null;
  source?: ((creep: Creep) => boolean) | null;
  target?: ((creep: Creep) => boolean) | null;
  wait?: ((creep: Creep) => void) | null;
}

type CreepRole = (args: CreepRoleArgs) => (creep: Creep) => void;

interface CreepMemory {
  configName: string;
  ready?: boolean;
  working?: number;
  dying?: number;
}
